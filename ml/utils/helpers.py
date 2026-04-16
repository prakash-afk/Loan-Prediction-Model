import warnings

import matplotlib.pyplot as plt
import seaborn as sns


def setup_environment() -> None:
    warnings.filterwarnings("ignore")
    plt.rcParams["figure.dpi"] = 130
    plt.rcParams["font.family"] = "DejaVu Sans"
    sns.set_style("darkgrid")
    print("All libraries imported successfully.")


def combine_all_results(results, tuned_results, xgb_result):
    all_results = {}
    all_results.update(results)
    all_results.update(tuned_results)
    all_results.update(xgb_result)
    return all_results
