from sklearn.metrics import accuracy_score, classification_report

from ml.utils.helpers import combine_all_results


def show_best_model(results, tuned_results, xgb_result):
    all_results = combine_all_results(results, tuned_results, xgb_result)

    best_name = max(all_results, key=lambda n: all_results[n]["cv_mean"])
    best = all_results[best_name]
    best_model = best["model"]

    print(f"Best Model : {best_name}")
    print(f"Test Acc   : {best['test_acc']:.4f}")
    print(f"CV Mean    : {best['cv_mean']:.4f} +/- {best['cv_std']:.4f}")
    return best_name, best, best_model


def print_classification_report_text(best_name, y_test, y_pred):
    print("=" * 55)
    print(f"CLASSIFICATION REPORT — {best_name}")
    print("=" * 55)
    print(classification_report(y_test, y_pred))


def run_overfitting_check(results, tuned_results, xgb_result, X_train, X_train_scaled, y_train):
    print("\n" + "=" * 60)
    print("OVERFITTING CHECK - FINAL MODELS")
    print("=" * 60)

    all_results = combine_all_results(results, tuned_results, xgb_result)

    for name, res in all_results.items():
        model = res["model"]

        if name == "Logistic Regression":
            X_tr = X_train_scaled
        else:
            X_tr = X_train

        train_acc = accuracy_score(y_train, model.predict(X_tr))
        test_acc = res["test_acc"]
        gap = train_acc - test_acc

        if train_acc < 0.85 and test_acc < 0.85:
            status = "UNDERFIT"
        elif train_acc >= 0.85 and gap > 0.05:
            status = "OVERFIT"
        elif train_acc >= 0.85 and gap <= 0.05:
            status = "GOOD"

        print(f"{name:<30} Train: {train_acc:.4f}  Test: {test_acc:.4f}  Gap: {gap:.4f}  [{status}]")
