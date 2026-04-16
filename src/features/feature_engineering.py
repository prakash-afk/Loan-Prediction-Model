def inspect_derogatory_marks(df):
    print(df["derogatory_marks"].value_counts())


def create_has_derog_feature(df):
    df["has_derog"] = (df["derogatory_marks"] > 0).astype(int)
    print(df["has_derog"].value_counts())
    return df


def drop_derogatory_marks(df):
    df.drop(columns=["derogatory_marks"], axis=1, inplace=True)
    return df


def drop_loan_to_income_ratio(df):
    df.drop("loan_to_income_ratio", axis=1, inplace=True)
    return df


def add_net_worth_feature(df_model):
    df_model["net_worth"] = df_model["savings_assets"] - df_model["current_debt"]
    return df_model
