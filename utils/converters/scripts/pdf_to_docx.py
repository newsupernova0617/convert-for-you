#!/usr/bin/env python3
"""
Convert PDF to DOCX using pdf2docx.

Usage:
    python pdf_to_docx.py <input_pdf_path> <output_docx_path>
"""

import sys

try:
    from pdf2docx import Converter
except ImportError:
    sys.stderr.write(
        "pdf2docx 모듈을 찾을 수 없습니다. `pip install pdf2docx`로 설치하세요.\n"
    )
    sys.exit(2)


def main():
    if len(sys.argv) != 3:
        sys.stderr.write("Usage: pdf_to_docx.py <input_pdf> <output_docx>\n")
        return 1

    input_pdf, output_docx = sys.argv[1:3]

    try:
        converter = Converter(input_pdf)
        converter.convert(output_docx, start=0, end=None)
        converter.close()
    except Exception as exc:  # pylint: disable=broad-except
        sys.stderr.write(f"변환에 실패했습니다: {exc}\n")
        return 3

    return 0


if __name__ == "__main__":
    sys.exit(main())
