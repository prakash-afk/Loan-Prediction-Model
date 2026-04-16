from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier


def train_baseline_models(X_train, X_test, y_train, y_test, X_train_scaled, X_test_scaled):
    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000,
            random_state=42,
            class_weight="balanced"
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=6,
            random_state=42,
            class_weight="balanced"
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=150,
            max_depth=8,
            random_state=42,
            n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=3,
            random_state=42
        )
    }

    results = {}
    cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    X_tr = None
    X_te = None

    for name, model in models.items():
        if name == "Logistic Regression":
            X_tr, X_te = X_train_scaled, X_test_scaled
        else:
            X_tr, X_te = X_train, X_test

        model.fit(X_tr, y_train)
        y_pred = model.predict(X_te)
        acc = accuracy_score(y_test, y_pred)

        cv = cross_val_score(
            model,
            X_tr,
            y_train,
            cv=cv_strategy,
            scoring="accuracy",
            n_jobs=-1
        )

        results[name] = {
            "model": model,
            "test_acc": acc,
            "cv_mean": cv.mean(),
            "cv_std": cv.std(),
            "y_pred": y_pred
        }

        print(f"{name:<25} Test: {acc:.4f}  CV: {cv.mean():.4f} +/- {cv.std():.4f}")

    return results, X_tr, X_te


def train_tuned_models(X_tr, X_test, y_train, y_test):
    tuned_models = {
        "Random Forest Tuned": RandomForestClassifier(
            n_estimators=300,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        ),
        "Gradient Boosting Tuned": GradientBoostingClassifier(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=3,
            subsample=0.8,
            random_state=42
        )
    }

    tuned_results = {}
    cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, model in tuned_models.items():
        model.fit(X_tr, y_train)
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)

        cv = cross_val_score(
            model,
            X_tr,
            y_train,
            cv=cv_strategy,
            scoring="accuracy",
            n_jobs=-1
        )

        tuned_results[name] = {
            "model": model,
            "test_acc": acc,
            "cv_mean": cv.mean(),
            "cv_std": cv.std(),
            "y_pred": y_pred
        }

        print(f"{name:<25} Test: {acc:.4f}  CV: {cv.mean():.4f} +/- {cv.std():.4f}")

    return tuned_results


def train_xgboost_model(X_train, X_test, y_train, y_test):
    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="logloss",
        random_state=42
    )

    xgb.fit(X_train, y_train)

    y_pred = xgb.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv = cross_val_score(
        xgb,
        X_train,
        y_train,
        cv=cv_strategy,
        scoring="accuracy",
        n_jobs=-1
    )

    xgb_result = {
        "XGBoost": {
            "model": xgb,
            "test_acc": acc,
            "cv_mean": cv.mean(),
            "cv_std": cv.std(),
            "y_pred": y_pred
        }
    }

    print(f"XGBoost                  Test: {acc:.4f}  CV: {cv.mean():.4f} +/- {cv.std():.4f}")
    return xgb_result
