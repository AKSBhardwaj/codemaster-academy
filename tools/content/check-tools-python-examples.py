"""Check authored local Python examples without touching learner files.

Optional dependencies live outside the application. Pass a temporary pip --target
directory with "site-packages" in its name as the first argument (dill recognises
installed modules by this path marker), or use an isolated environment containing
the libraries imported by the selected examples. TensorFlow, PyTorch and browser
drivers are not executed by this small-library check.
"""
import contextlib
import importlib.metadata
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import warnings

if len(sys.argv) > 1:
    sys.path.insert(0, sys.argv[1])
os.environ['MPLBACKEND'] = 'Agg'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ['HF_DATASETS_DISABLE_PROGRESS_BARS'] = '1'
os.environ['LANGCHAIN_TRACING_V2'] = 'false'
os.environ['LANGSMITH_TRACING'] = 'false'
warnings.filterwarnings('ignore', message='FigureCanvasAgg is non-interactive.*')
content = Path(__file__).resolve().parents[2] / 'src/assets/content'
categories = ['ai-data-science', 'devops-cloud-tools', 'software-engineering']
slugs = [item['slug'] for category in categories for item in json.loads((content / 'catalog/technologies' / f'{category}.json').read_text(encoding='utf-8'))]
syntax_count = 0
run_count = 0
failed = []
for slug in slugs:
    for path in sorted((content / 'technologies' / slug / 'lessons').glob('*.json')):
        lesson = json.loads(path.read_text(encoding='utf-8'))
        for block in lesson['blocks']:
            if block['type'] != 'code' or block['language'] != 'python':
                continue
            source = block['code']
            try:
                compile(source, str(path), 'exec')
                syntax_count += 1
                if slug in ['tensorflow', 'pytorch', 'selenium']:
                    continue
                output = io.StringIO()
                previous = os.getcwd()
                with tempfile.TemporaryDirectory(prefix='tutorial-code-') as temporary:
                    try:
                        os.chdir(temporary)
                        with contextlib.redirect_stdout(output):
                            exec(compile(source, str(path), 'exec'), {'__name__': '__main__'})
                        if 'matplotlib.pyplot' in sys.modules:
                            sys.modules['matplotlib.pyplot'].close('all')
                    finally:
                        os.chdir(previous)
                run_count += 1
                print(f'{slug}/{path.stem}: {output.getvalue().strip() or "[chart created]"}')
            except Exception as error:
                failed.append(f'{slug}/{path.stem}: {type(error).__name__}: {error}')
for failure in failed:
    print('FAIL:', failure)
print(f'Python syntax checked: {syntax_count}; local examples executed: {run_count}; failures: {len(failed)}')
sys.exit(bool(failed))
