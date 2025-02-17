import os
import subprocess

def count_lines_of_code(language_extensions=None):
    """
    This function counts the total number of lines of code in a Git repository for
    specified languages.

    **Note:** This method counts all lines, including comments and blank lines.
    """

    # Get list of files tracked by the Git repository
    result = subprocess.run(['git', 'ls-files'], capture_output=True, text=True)
    files = result.stdout.splitlines()

    total_lines = 0

    # Filter files by the specified language extensions
    for file in files:
        if language_extensions and not any(file.endswith(ext) for ext in language_extensions):
            continue  # Skip files that don't match the specified language extensions

        try:
            with open(file, 'r', errors='ignore') as f:
                total_lines += sum(1 for _ in f)
        except Exception as e:
            print(f"Error reading {file}: {e}")
            continue

    # Print the total number of lines found
    print(f"Total lines of code: {total_lines}")

if __name__ == "__main__":
    # Specify the extensions for the language you're interested in
    language_extensions = ['.html']  # For example, Python and JavaScript files
    count_lines_of_code(language_extensions)
