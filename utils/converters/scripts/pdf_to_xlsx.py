#!/usr/bin/env python3
"""
Convert PDF tables to XLSX using camelot and pandas.

Usage:
    python pdf_to_xlsx.py <input_pdf_path> <output_xlsx_path>
"""

import sys

try:
    import camelot
except ImportError:
    sys.stderr.write(
        "camelot 모듈을 찾을 수 없습니다. `pip install camelot-py[cv]`로 설치하세요.\n"
    )
    sys.exit(2)

try:
    import pandas as pd
except ImportError:
    sys.stderr.write(
        "pandas 모듈을 찾을 수 없습니다. `pip install pandas`로 설치하세요.\n"
    )
    sys.exit(2)

try:
    from openpyxl import Workbook
except ImportError:
    sys.stderr.write(
        "openpyxl 모듈을 찾을 수 없습니다. `pip install openpyxl`로 설치하세요.\n"
    )
    sys.exit(2)

from pathlib import Path


def build_empty_workbook(path: Path) -> None:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Summary"
    sheet.append(["PDF에서 테이블을 감지하지 못했습니다."])
    workbook.save(path)


def main() -> int:
    if len(sys.argv) != 3:
        sys.stderr.write("Usage: pdf_to_xlsx.py <input_pdf> <output_xlsx>\n")
        return 1

    input_pdf = Path(sys.argv[1]).expanduser().resolve()
    output_xlsx = Path(sys.argv[2]).expanduser().resolve()

    try:
        tables = camelot.read_pdf(str(input_pdf), pages="all", flavor="stream")

        if tables.n == 0:
            build_empty_workbook(output_xlsx)
            return 0

        with pd.ExcelWriter(output_xlsx, engine="openpyxl") as writer:
            for idx, table in enumerate(tables, start=1):
                df = table.df
                df.to_excel(writer, sheet_name=f"Table{idx}", index=False, header=False)
    except Exception as exc:  # pylint: disable=broad-except
        sys.stderr.write(f"변환에 실패했습니다: {exc}\n")
        return 3

    return 0


if __name__ == "__main__":
    sys.exit(main())
