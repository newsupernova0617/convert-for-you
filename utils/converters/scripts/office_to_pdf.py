#!/usr/bin/env python3
"""
Convert Office documents (DOCX/XLSX/PPTX) to PDF using LibreOffice.

Usage:
    python office_to_pdf.py <input_file> <output_pdf>
"""

import sys
import os
import subprocess
import shutil
from pathlib import Path


def find_libreoffice():
    """Find LibreOffice executable."""
    possible_paths = [
        'libreoffice',
        'soffice',
        '/usr/bin/libreoffice',
        '/usr/bin/soffice',
        '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    ]

    for path in possible_paths:
        if shutil.which(path) or os.path.exists(path):
            return path

    return None


def convert_office_to_pdf(input_file, output_pdf):
    """
    Convert Office document to PDF using LibreOffice.

    Args:
        input_file: Path to input Office file (docx/xlsx/pptx)
        output_pdf: Path to output PDF file

    Returns:
        0 on success, non-zero on failure
    """
    libreoffice_path = find_libreoffice()

    if not libreoffice_path:
        sys.stderr.write("LibreOffice를 찾을 수 없습니다. LibreOffice를 설치해주세요.\n")
        return 2

    if not os.path.exists(input_file):
        sys.stderr.write(f"입력 파일을 찾을 수 없습니다: {input_file}\n")
        return 1

    # Create output directory
    output_dir = os.path.dirname(output_pdf)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    # Use temp directory if no output directory specified
    if not output_dir:
        output_dir = os.path.dirname(input_file)

    try:
        # Convert to PDF using LibreOffice
        cmd = [
            libreoffice_path,
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', output_dir,
            input_file
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )

        if result.returncode != 0:
            sys.stderr.write(f"LibreOffice 변환 실패:\n{result.stderr}\n")
            return 3

        # LibreOffice creates PDF with same basename as input file
        input_basename = os.path.splitext(os.path.basename(input_file))[0]
        temp_pdf = os.path.join(output_dir, f"{input_basename}.pdf")

        # Move to desired output location if different
        if temp_pdf != output_pdf and os.path.exists(temp_pdf):
            shutil.move(temp_pdf, output_pdf)

        if not os.path.exists(output_pdf):
            sys.stderr.write(f"PDF 파일이 생성되지 않았습니다: {output_pdf}\n")
            return 4

        return 0

    except subprocess.TimeoutExpired:
        sys.stderr.write("변환 시간이 초과되었습니다 (5분).\n")
        return 5
    except Exception as exc:
        sys.stderr.write(f"변환 중 오류 발생: {exc}\n")
        return 6


def main():
    if len(sys.argv) != 3:
        sys.stderr.write("Usage: office_to_pdf.py <input_office_file> <output_pdf>\n")
        return 1

    input_file, output_pdf = sys.argv[1:3]

    # Validate input file extension
    valid_extensions = ['.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt']
    file_ext = os.path.splitext(input_file)[1].lower()

    if file_ext not in valid_extensions:
        sys.stderr.write(f"지원하지 않는 파일 형식입니다: {file_ext}\n")
        sys.stderr.write(f"지원 형식: {', '.join(valid_extensions)}\n")
        return 1

    return convert_office_to_pdf(input_file, output_pdf)


if __name__ == "__main__":
    sys.exit(main())
