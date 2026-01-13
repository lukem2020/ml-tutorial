#!/usr/bin/env python3
"""Script to run black formatter on all .py files and format .json files."""
import json
import subprocess
import sys
from pathlib import Path


def format_json_files(repo_root: Path) -> int:
    """Format all .json files in main project directories only."""
    # Directories to exclude
    exclude_dirs = {
        ".venv",
        "venv",
        "env",
        ".env",
        "node_modules",
        ".git",
        "__pycache__",
        ".next",
        ".pytest_cache",
        ".mypy_cache",
        "dist",
        "build",
        ".idea",
        ".vscode",
    }

    # Only process files in root and main project directories
    json_files = []

    # Get files from root directory
    for json_file in repo_root.glob("*.json"):
        json_files.append(json_file)

    # Get files from main project directories (one level deep)
    for subdir in repo_root.iterdir():
        if subdir.is_dir() and subdir.name not in exclude_dirs:
            # Files directly in subdirectory
            for json_file in subdir.glob("*.json"):
                json_files.append(json_file)
            # Files in subdirectories (two levels deep max)
            for subsubdir in subdir.iterdir():
                if subsubdir.is_dir() and subsubdir.name not in exclude_dirs:
                    for json_file in subsubdir.glob("*.json"):
                        json_files.append(json_file)

    if not json_files:
        return 0

    print(f"Formatting {len(json_files)} JSON file(s)...")
    errors = 0

    for json_file in json_files:
        try:
            # Double-check: skip if path contains excluded directories
            if any(excluded in str(json_file) for excluded in exclude_dirs):
                continue

            # Read JSON file
            with open(json_file, "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError as e:
                    print(
                        f"Error: Invalid JSON in {json_file}: {e}",
                        file=sys.stderr,
                    )
                    errors += 1
                    continue

            # Write formatted JSON back
            with open(json_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
                f.write("\n")  # Add trailing newline

            print(f"  Formatted: {json_file.relative_to(repo_root)}")

        except Exception as e:
            print(f"Error formatting {json_file}: {e}", file=sys.stderr)
            errors += 1

    return errors


def main():
    """Run black on all .py files and format .json files in the repository."""
    repo_root = Path.cwd()

    print("Formatting files in repository...")
    print(f"Repository root: {repo_root}")
    print()

    exit_code = 0

    # Format JSON files
    json_errors = format_json_files(repo_root)
    if json_errors > 0:
        exit_code = 1
        print()

    # Run black on all .py files in main directories only
    print("Running black on all .py files...")
    try:
        result = subprocess.run(
            [
                "black",
                "--include",
                r"\.py$",
                "--exclude",
                r"/(\.venv|venv|env|\.env|node_modules|\.git|__pycache__|\.pytest_cache|\.mypy_cache|dist|build|\.idea|\.vscode)/",
                ".",
            ],
            cwd=repo_root,
            check=False,
            capture_output=True,
            text=True,
        )

        # Print output
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

        # Use black's exit code if it's non-zero, otherwise keep JSON errors
        if result.returncode != 0:
            exit_code = result.returncode

    except FileNotFoundError:
        print("Error: black not found. Please install it with: pip install black")
        exit_code = 1
    except Exception as e:
        print(f"Error running black: {e}")
        exit_code = 1

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
