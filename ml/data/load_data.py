import pandas as pd

from app.core.config import DATA_PATH


def load_data():
    df = pd.read_csv(DATA_PATH)
    df.columns = df.columns.str.strip()

    print("Dataset Shape:", df.shape)
    print(df.head())
    return df


def show_basic_data_info(df):
    print("=" * 55)
    print("DATASET INFO")
    print("=" * 55)
    df.info()

    print("\n" + "=" * 55)
    print("STATISTICAL SUMMARY")
    print("=" * 55)
    print(df.describe().T)


def show_missing_values(df):
    missing = df.isnull().sum()
    percent = (missing / len(df)) * 100

    missing_df = pd.DataFrame(
        {
            "Missing Values": missing,
            "Percentage": percent,
        }
    )
    print(missing_df)
    return missing_df
