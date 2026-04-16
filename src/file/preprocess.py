import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler


def drop_customer_id(df):
    df.drop(columns=["customer_id"], inplace=True)
    print("loan_id dropped. New shape:", df.shape)
    return df


def fix_negative_assets(df):
    negative_assets = df[df["savings_assets"] < 0]
    print(f"Rows with negative savings_assets: {len(negative_assets)}")

    df = df[df["savings_assets"] >= 0]
    print(f"Dataset shape after fix: {df.shape}")
    return df


def apply_log_transformation(df):
    skewed_cols = [
        "annual_income",
        "savings_assets",
        "current_debt",
        "loan_amount",
    ]

    for col in skewed_cols:
        df[col] = np.log1p(df[col])

    return df


def cap_outliers(df):
    cap_cols = ["annual_income", "savings_assets", "current_debt", "loan_amount"]

    for col in cap_cols:
        lower = df[col].quantile(0.01)
        upper = df[col].quantile(0.99)
        df[col] = df[col].clip(lower=lower, upper=upper)

    return df


def encode_categorical_features(df):
    df_model = df.copy()

    for col in df_model.select_dtypes(include="object").columns:
        df_model[col] = LabelEncoder().fit_transform(df_model[col])

    return df_model


def split_features_and_target(df_model, target_col):
    X = df_model.drop(columns=[target_col])
    y = df_model[target_col]

    print("Features shape:", X.shape)
    print("Target shape  :", y.shape)
    print("Target classes:", y.unique())
    return X, y


def split_train_test_data(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Training set : {X_train.shape}")
    print(f"Test set     : {X_test.shape}")
    return X_train, X_test, y_train, y_test


def scale_features(X_train, X_test):
    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    return X_train_scaled, X_test_scaled, scaler
