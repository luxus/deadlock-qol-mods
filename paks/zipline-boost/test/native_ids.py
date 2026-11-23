#!/usr/bin/env python3
import runpy, sys
from pathlib import Path

sys.argv[0] = str(Path(__file__).resolve().parents[3] / 'tools' / 'native_ids.py')
runpy.run_path(sys.argv[0], run_name='__main__')
