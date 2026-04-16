import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import confusion_matrix, roc_auc_score, roc_curve

from config import LABEL_MAP, PALETTE
from src.utils.helpers import combine_all_results


def plot_target_distribution(df, target_col):
    counts = df[target_col].value_counts()
    counts.index = counts.index.map(LABEL_MAP)

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    fig.suptitle("Loan Approval Distribution", fontsize=17, fontweight="bold", y=1.02)

    axes[0].pie(
        counts.values,
        labels=counts.index,
        colors=[PALETTE[0], PALETTE[1]],
        autopct="%1.1f%%",
        startangle=140,
        wedgeprops=dict(edgecolor="white", linewidth=2),
        textprops={"fontsize": 13},
    )
    axes[0].set_title("Proportion", fontsize=13)

    axes[1].bar(
        counts.index,
        counts.values,
        color=[PALETTE[0], PALETTE[1]],
        edgecolor="white",
        linewidth=1.5,
        width=0.5,
    )

    axes[1].set_title("Count", fontsize=13)
    axes[1].set_ylabel("Number of Applications", fontsize=11)

    for i, v in enumerate(counts.values):
        axes[1].text(i, v + 200, str(v), ha="center", fontsize=12, fontweight="bold")

    plt.tight_layout()
    plt.show()


def plot_numerical_feature_distribution(df, target_col):
    num_cols = df.select_dtypes(include=["int64", "float64"]).columns.tolist()
    if target_col in num_cols:
        num_cols.remove(target_col)

    n = len(num_cols)
    cols_per_row = 3
    rows = (n + cols_per_row - 1) // cols_per_row

    fig, axes = plt.subplots(rows, cols_per_row, figsize=(16, rows * 4))
    axes = axes.flatten()

    for i, col in enumerate(num_cols):
        axes[i].hist(
            df[col].dropna(),
            bins=30,
            color=PALETTE[i % len(PALETTE)],
            edgecolor="white",
            linewidth=0.6,
            alpha=0.9,
        )
        axes[i].set_title(col, fontsize=12, fontweight="bold")
        axes[i].set_xlabel("Value", fontsize=10)
        axes[i].set_ylabel("Frequency", fontsize=10)

    for j in range(i + 1, len(axes)):
        axes[j].set_visible(False)

    plt.suptitle("Numerical Features Distribution", fontsize=16, fontweight="bold", y=1.01)
    plt.tight_layout()
    plt.show()
    return num_cols, rows, cols_per_row


def plot_categorical_features(df, target_col):
    cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
    if target_col in cat_cols:
        cat_cols.remove(target_col)

    print("Categorical Columns:", cat_cols)

    for i, col in enumerate(cat_cols):
        counts = df[col].value_counts()
        fig, ax = plt.subplots(figsize=(8, 4))
        bars = ax.bar(
            counts.index,
            counts.values,
            color=PALETTE[: len(counts)],
            edgecolor="white",
            linewidth=1,
        )
        ax.set_title(f"Distribution of: {col}", fontsize=14, fontweight="bold")
        ax.set_ylabel("Count", fontsize=11)
        for bar in bars:
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 5,
                str(int(bar.get_height())),
                ha="center",
                fontsize=11,
            )
        plt.tight_layout()
        plt.show()

    fig, axes = plt.subplots(1, len(cat_cols), figsize=(6 * len(cat_cols), 5))

    if len(cat_cols) == 1:
        axes = [axes]

    for i, col in enumerate(cat_cols):
        ct = pd.crosstab(df[col], df[target_col], normalize="index") * 100
        ct.plot(
            kind="bar",
            ax=axes[i],
            color=[PALETTE[0], PALETTE[1]],
            edgecolor="white",
            linewidth=0.8,
            width=0.6,
        )
        axes[i].set_title(f"{col} vs Loan Status (%)", fontsize=13, fontweight="bold")
        axes[i].set_ylabel("Percentage (%)", fontsize=10)
        axes[i].set_xticklabels(axes[i].get_xticklabels(), rotation=30)
        axes[i].legend(title="Loan Status", fontsize=9)

    plt.suptitle("Categorical Features vs Target", fontsize=16, fontweight="bold", y=1.02)
    plt.tight_layout()
    plt.show()


def show_numeric_columns(df, target_col):
    num_cols = df.select_dtypes(include=["int64", "float64"]).columns.tolist()

    if target_col in num_cols:
        num_cols.remove(target_col)

    print(num_cols)
    return num_cols


def plot_outlier_boxplots(df, num_cols, rows, cols_per_row):
    fig, axes = plt.subplots(rows, cols_per_row, figsize=(16, rows * 4))
    axes = axes.flatten()

    for i, col in enumerate(num_cols):
        axes[i].boxplot(
            df[col].dropna(),
            patch_artist=True,
            boxprops=dict(facecolor=PALETTE[i % len(PALETTE)], alpha=0.7),
            medianprops=dict(color="white", linewidth=2),
            whiskerprops=dict(color="gray"),
            capprops=dict(color="gray"),
            flierprops=dict(marker="o", color=PALETTE[1], alpha=0.4, markersize=4),
        )
        axes[i].set_title(col, fontsize=12, fontweight="bold")

    for j in range(i + 1, len(axes)):
        axes[j].set_visible(False)

    plt.suptitle("Outlier Detection — Boxplots", fontsize=16, fontweight="bold", y=1.01)
    plt.tight_layout()
    plt.show()


def plot_correlation_heatmap(df, num_cols):
    fig, ax = plt.subplots(figsize=(12, 8))

    corr_matrix = df[num_cols].corr()

    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    sns.heatmap(
        corr_matrix,
        mask=mask,
        annot=True,
        fmt=".2f",
        cmap="coolwarm",
        center=0,
        linewidths=0.5,
        linecolor="white",
        ax=ax,
        annot_kws={"size": 10},
    )

    ax.set_title("Correlation Heatmap", fontsize=16, fontweight="bold", pad=15)
    plt.tight_layout()
    plt.show()


def plot_model_comparison(results, tuned_results, xgb_result):
    all_results = combine_all_results(results, tuned_results, xgb_result)

    names = sorted(all_results.keys(), key=lambda n: all_results[n]["cv_mean"], reverse=True)

    test_acc = [all_results[n]["test_acc"] for n in names]
    cv_mean = [all_results[n]["cv_mean"] for n in names]
    cv_std = [all_results[n]["cv_std"] for n in names]

    x = np.arange(len(names))
    width = 0.38

    fig, ax = plt.subplots(figsize=(14, 7))

    bars1 = ax.bar(
        x - width / 2,
        test_acc,
        width,
        label="Test Accuracy",
        color=PALETTE[0],
        edgecolor="white",
        linewidth=1,
    )

    bars2 = ax.bar(
        x + width / 2,
        cv_mean,
        width,
        yerr=cv_std,
        capsize=4,
        label="CV Mean Accuracy",
        color=PALETTE[3],
        edgecolor="white",
        linewidth=1,
    )

    for bar in list(bars1) + list(bars2):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.002,
            f"{bar.get_height():.3f}",
            ha="center",
            va="bottom",
            fontsize=9,
            fontweight="bold",
        )

    ax.set_xticks(x)
    ax.set_xticklabels(names, rotation=20, fontsize=11)
    ax.set_ylim(0.75, 1.01)
    ax.set_ylabel("Accuracy", fontsize=12)
    ax.set_title("Final Model Comparison - Baseline vs Tuned vs XGBoost", fontsize=16, fontweight="bold")
    ax.legend(fontsize=11)
    ax.grid(axis="y", linestyle="--", alpha=0.4)

    plt.tight_layout()
    plt.show()


def plot_confusion_matrix(best_name, y_test, y_pred):
    cm = confusion_matrix(y_test, y_pred)

    fig, ax = plt.subplots(figsize=(7, 5))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Rejected", "Approved"],
        yticklabels=["Rejected", "Approved"],
        linewidths=1,
        linecolor="white",
        annot_kws={"size": 14, "weight": "bold"},
    )
    ax.set_title(f"Confusion Matrix  {best_name}", fontsize=14, fontweight="bold")
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("Actual", fontsize=12)
    plt.tight_layout()
    plt.show()


def plot_roc_curve(results, tuned_results, xgb_result, X_test, X_test_scaled, y_test):
    all_results = combine_all_results(results, tuned_results, xgb_result)

    fig, ax = plt.subplots(figsize=(9, 7))

    for name, res in all_results.items():
        model = res["model"]

        if name == "Logistic Regression":
            X_te = X_test_scaled
        else:
            X_te = X_test

        if hasattr(model, "predict_proba"):
            y_prob = model.predict_proba(X_te)[:, 1]
            fpr, tpr, _ = roc_curve(y_test, y_prob)
            auc = roc_auc_score(y_test, y_prob)

            ax.plot(fpr, tpr, linewidth=2, label=f"{name} (AUC = {auc:.3f})")

    ax.plot([0, 1], [0, 1], "k--", linewidth=1, label="Random Guess")

    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.set_title("ROC Curve - Baseline vs Tuned vs XGBoost", fontsize=15, fontweight="bold")
    ax.legend(fontsize=9, loc="lower right")
    ax.grid(alpha=0.3)

    plt.tight_layout()
    plt.show()


def plot_feature_importance(best_model, X, best_name):
    if hasattr(best_model, "feature_importances_"):
        importances = pd.Series(best_model.feature_importances_, index=X.columns)
        importances = importances.sort_values(ascending=True)

        fig, ax = plt.subplots(figsize=(10, 6))
        ax.barh(
            importances.index,
            importances.values,
            color=[PALETTE[i % len(PALETTE)] for i in range(len(importances))],
            edgecolor="white",
            linewidth=0.8,
        )
        ax.set_title(f"Feature Importance — {best_name}", fontsize=14, fontweight="bold")
        ax.set_xlabel("Importance Score", fontsize=11)
        plt.tight_layout()
        plt.show()
    else:
        print("Feature importance not available for this model type.")
