from app.core.config import TARGET_COL
from ml.data.load_data import load_data, show_basic_data_info, show_missing_values
from ml.data.preprocess import (
    apply_cap_bounds,
    apply_log_transformation,
    cap_outliers,
    drop_customer_id,
    encode_categorical_features,
    fit_label_encoders,
    fix_negative_assets,
    get_cap_bounds,
    scale_features,
    split_features_and_target,
    split_train_test_data,
)
from ml.features.feature_engineering import (
    add_net_worth_feature,
    create_has_derog_feature,
    drop_derogatory_marks,
    drop_loan_to_income_ratio,
    inspect_derogatory_marks,
)
from ml.models.evaluate import (
    print_classification_report_text,
    run_overfitting_check,
    show_best_model,
)
from ml.models.predict import create_sample_applicants, predict_sample_applicants
from ml.models.save_artifacts import save_training_artifacts
from ml.models.train import (
    train_baseline_models,
    train_tuned_models,
    train_xgboost_model,
)
from ml.utils.helpers import setup_environment
from ml.visualization.plots import (
    plot_categorical_features,
    plot_confusion_matrix,
    plot_correlation_heatmap,
    plot_feature_importance,
    plot_model_comparison,
    plot_numerical_feature_distribution,
    plot_outlier_boxplots,
    plot_roc_curve,
    plot_target_distribution,
    show_numeric_columns,
)


def main():
    setup_environment()

    df = load_data()
    df = drop_customer_id(df)

    show_basic_data_info(df)
    show_missing_values(df)

    df = fix_negative_assets(df)

    target_col = TARGET_COL
    plot_target_distribution(df, target_col)
    _, rows, cols_per_row = plot_numerical_feature_distribution(df, target_col)

    df = apply_log_transformation(df)

    inspect_derogatory_marks(df)
    df = create_has_derog_feature(df)
    df = drop_derogatory_marks(df)

    plot_categorical_features(df, target_col)

    num_cols = show_numeric_columns(df, target_col)
    plot_outlier_boxplots(df, num_cols, rows, cols_per_row)

    cap_bounds = get_cap_bounds(df)
    df = apply_cap_bounds(df, cap_bounds)
    plot_correlation_heatmap(df, num_cols)

    df = drop_loan_to_income_ratio(df)

    encoders = fit_label_encoders(df)
    df_model = encode_categorical_features(df)
    df_model = add_net_worth_feature(df_model)

    X, y = split_features_and_target(df_model, target_col)
    X_train, X_test, y_train, y_test = split_train_test_data(X, y)
    X_train_scaled, X_test_scaled, scaler = scale_features(X_train, X_test)

    results, X_tr, X_te = train_baseline_models(
        X_train,
        X_test,
        y_train,
        y_test,
        X_train_scaled,
        X_test_scaled,
    )
    tuned_results = train_tuned_models(X_tr, X_test, y_train, y_test)
    xgb_result = train_xgboost_model(X_train, X_test, y_train, y_test)

    plot_model_comparison(results, tuned_results, xgb_result)

    best_name, best, best_model = show_best_model(results, tuned_results, xgb_result)
    print_classification_report_text(best_name, y_test, best["y_pred"])

    plot_confusion_matrix(best_name, y_test, best["y_pred"])
    plot_roc_curve(results, tuned_results, xgb_result, X_test, X_test_scaled, y_test)
    plot_feature_importance(best_model, X, best_name)

    run_overfitting_check(results, tuned_results, xgb_result, X_train, X_train_scaled, y_train)

    sample_applicants, applicant_names = create_sample_applicants()
    results_df, styled = predict_sample_applicants(
        sample_applicants,
        applicant_names,
        X_train,
        xgb_result,
    )

    save_training_artifacts(
        best_model=best_model,
        scaler=scaler,
        encoders=encoders,
        cap_bounds=cap_bounds,
        feature_columns=X_train.columns.tolist(),
        best_name=best_name,
    )

    return {
        "df": df,
        "df_model": df_model,
        "X": X,
        "y": y,
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "X_train_scaled": X_train_scaled,
        "X_test_scaled": X_test_scaled,
        "scaler": scaler,
        "results": results,
        "tuned_results": tuned_results,
        "xgb_result": xgb_result,
        "best_name": best_name,
        "best": best,
        "best_model": best_model,
        "encoders": encoders,
        "cap_bounds": cap_bounds,
        "sample_applicants": sample_applicants,
        "results_df": results_df,
        "styled": styled,
    }


if __name__ == "__main__":
    main()
