"""Build the web-owned introductory courses from hand-authored lesson records.

This helper supplies file/schema structure only. Each record supplies its own concept,
example, observed result, mistake, small task, and question. It never derives a course
by replacing a technology name in another course.
"""
import json
import re
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / 'src/assets/content/technologies'
CATALOG = {}
WALKTHROUGH = runpy.run_path(str(Path(__file__).with_name('author-web-walkthrough.py')))['walkthrough']
for category in ('web-development', 'frontend-frameworks', 'databases'):
    for item in json.loads((ROOT / f'src/assets/content/catalog/technologies/{category}.json').read_text(encoding='utf-8')):
        CATALOG[item['slug']] = item


def lesson(title, explanation, language, code, result, mistake, task, question, answer, wrong, *, slug=None, runnable=False):
    return dict(title=title, explanation=explanation, language=language, code=code.strip(), result=result,
                mistake=mistake, task=task, question=question, answer=answer, wrong=wrong,
                slug=slug or re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-'), runnable=runnable)


def build(slug, description, environment, version, lessons):
    assert len(lessons) == 12, (slug, len(lessons))
    name = CATALOG[slug]['name']
    dest = CONTENT / slug
    # A known source file identifies courses owned by this authoring helper.
    existing = dest / 'overview.json'
    if existing.exists():
        data = json.loads(existing.read_text(encoding='utf-8'))
        assert data.get('versionNote') == version, f'Refusing to replace an existing course: {slug}'
    (dest / 'lessons').mkdir(parents=True, exist_ok=True)

    def save(file, data):
        (dest / file).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    def description_for(text):
        if len(text) <= 170:
            return text if len(text) >= 50 else text + ' Learn with a small, explained example.'
        first = re.split(r'(?<=[.!?])\s+', text)[0]
        if len(first) < 50:
            first += ' Learn with a small example and a practice question.'
        assert 50 <= len(first) <= 170, (slug, first)
        return first

    def short(text, limit=200):
        sentences = re.split(r'(?<=[.!?])\s+', text)
        answer = sentences.pop(0)
        while len(answer) < 40 and sentences:
            answer += ' ' + sentences.pop(0)
        assert 40 <= len(answer) <= limit, (slug, answer)
        return answer

    ids = [x['slug'] for x in lessons]
    assert len(ids) == len(set(ids)), slug
    goals = [f"Learn to {x['task'][0].lower() + x['task'][1:]}" for x in (lessons[1], lessons[4], lessons[8])]
    # Objectives are direct actions from the curriculum, bounded by the public schema.
    goals = [g.rstrip('.') for g in goals]
    assert all(10 <= len(g) <= 140 for g in goals), (slug, goals)
    save('overview.json', {
        'slug': slug, 'description': description + ' ' + environment,
        'versionNote': version, 'whatYouWillLearn': goals, 'learningObjectives': goals,
        'sidebarCategories': [
            {'id': 'first-steps', 'title': 'First steps', 'lessonSlugs': ids[:4]},
            {'id': 'build-skills', 'title': 'Build your skills', 'lessonSlugs': ids[4:8]},
            {'id': 'put-together', 'title': 'Put it together', 'lessonSlugs': ids[8:]},
        ],
        'seo': {'title': f'{name}: A Beginner Course', 'description': description_for(description)},
    })
    exercises = []
    quizzes = []
    references = []
    examples = []
    for index, row in enumerate(lessons):
        lesson_slug = row['slug']
        exercise_id = f'{slug}-{lesson_slug}-check'
        answer_index = index % 2
        options = [row['answer'], row['wrong']]
        if answer_index:
            options.reverse()
        q = {
            'id': exercise_id, 'type': 'multiple-choice', 'lessonSlug': lesson_slug,
            'difficulty': 'beginner', 'question': row['question'], 'options': options,
            'correctIndex': answer_index, 'explanation': row['explanation'],
        }
        exercises.append(q)
        quizzes.append({**q, 'id': f'{slug}-quiz-{index+1:02d}'})
        blocks = [
            {'type': 'heading', 'level': 2, 'text': 'The idea'},
            {'type': 'paragraph', 'text': row['explanation']},
            {'type': 'heading', 'level': 2, 'text': 'Read the example'},
            {'type': 'paragraph', 'text': environment},
            {'type': 'code', 'language': row['language'], 'code': row['code'], 'title': row['title'], 'runnable': row['runnable']},
            {'type': 'heading', 'level': 2, 'text': 'What happens'},
            {'type': 'paragraph', 'text': row['result']},
            {'type': 'alert', 'variant': 'warning', 'title': 'A mistake to avoid', 'text': row['mistake']},
            {'type': 'callout', 'icon': 'lightbulb', 'title': 'Your small task', 'text': row['task']},
            {'type': 'exercise', 'exerciseId': exercise_id},
        ]
        steps = WALKTHROUGH(slug, row['title'], row['code'])
        if steps:
            blocks[5:5] = [{'type': 'heading', 'level': 2, 'text': 'Read the code step by step'},
                           {'type': 'list', 'ordered': True, 'items': steps}]
        save(f'lessons/{lesson_slug}.json', {
            'schemaVersion': 1, 'slug': lesson_slug, 'title': row['title'],
            'summary': short(row['explanation']),
            'introduction': short(row['explanation']) + ' Your task: ' + row['task'],
            'learningObjectives': [row['task'], f"Explain the example for {row['title'].lower()}"],
            'blocks': blocks, 'exerciseIds': [exercise_id],
            'relatedLessons': [{'technologySlug': slug, 'slug': ids[index - 1] if index else ids[1]}],
            'seo': {'title': f"{name}: {row['title']}"[:70], 'description': description_for(row['explanation'])},
            'updatedOn': '2026-11-16',
        })
        references.append({'slug': lesson_slug, 'name': row['title'], 'summary': short(row['explanation']),
                           'example': {'language': row['language'], 'code': row['code']}, 'lessonSlug': lesson_slug})
        examples.append({'id': lesson_slug, 'title': row['title'], 'description': short(row['explanation']),
                         'language': row['language'], 'code': row['code'], 'output': row['result'],
                         'runnable': row['runnable'], 'tags': ['beginner'], 'lessonSlug': lesson_slug})
    save('exercises.json', {'title': f'{name} Practice', 'description': f'Practise the twelve ideas in this {name} course. Choose an answer, then read why it fits the example.', 'exercises': exercises})
    save('quiz.json', {'id': f'{slug}-quiz', 'title': f'{name} Review Quiz', 'description': f'Review the small examples from this {name} course. Take your time and read the reason given for each answer.', 'passPercent': 70, 'questions': quizzes})
    save('reference.json', {'title': f'{name} Quick Guide', 'description': f'Find a short explanation and a worked example for each idea in the {name} course.', 'groups': [
        {'id': 'first-steps', 'title': 'First steps', 'entries': references[:4]},
        {'id': 'build-skills', 'title': 'Build your skills', 'entries': references[4:8]},
        {'id': 'put-together', 'title': 'Put it together', 'entries': references[8:]},
    ]})
    save('examples.json', {'title': f'{name} Small Examples', 'description': f'Use these small {name} examples with the tools described in each lesson. Read the expected result before you try a change.', 'examples': examples})
    catalog_file = ROOT / f"src/assets/content/catalog/technologies/{CATALOG[slug]['categorySlug']}.json"
    catalog_rows = json.loads(catalog_file.read_text(encoding='utf-8'))
    assert 80 <= len(description) <= 280, (slug, 'catalog description length', len(description))
    for catalog_row in catalog_rows:
        if catalog_row['slug'] == slug:
            catalog_row['shortDescription'] = description
            catalog_row['highlights'] = [f"Practise {lessons[i]['title'].lower()}" for i in (1, 5, 9)]
    catalog_file.write_text(json.dumps(catalog_rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{slug}: 12 lessons, 12 exercises, 12 quiz questions, 12 references, 12 examples')
