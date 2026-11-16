"""Emit the explicitly authored tool, engineering and AI curricula in sibling files.

This formats original lesson records; it does not manufacture subject matter from names.
Run a sibling author-tools-*.py file to regenerate only its listed courses.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / 'src/assets/content'
CATALOG = {}
for category in ['ai-data-science', 'devops-cloud-tools', 'software-engineering']:
    for item in json.loads((CONTENT / 'catalog/technologies' / f'{category}.json').read_text(encoding='utf-8')):
        CATALOG[item['slug']] = item

def lesson(title, idea, code, result, task, warning, question, answer, wrong, language='text'):
    return dict(title=title, idea=idea, code=code, result=result, task=task,
                warning=warning, question=question, answer=answer, wrong=wrong, language=language)

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def course(slug, introduction, setup, docs, lessons):
    assert slug in CATALOG and len(lessons) >= 12
    name = CATALOG[slug]['name']
    category_path = CONTENT / 'catalog/technologies' / (CATALOG[slug]['categorySlug'] + '.json')
    category_items = json.loads(category_path.read_text(encoding='utf-8'))
    for entry in category_items:
        if entry['slug'] == slug:
            entry['shortDescription'] = introduction
            entry['highlights'] = ['Learn about ' + lessons[index]['title'].lower() for index in (2, 6, 10)]
    save(category_path, category_items)
    short = {'data-structures-algorithms':'Data Structures', 'object-oriented-programming':'OOP',
             'cybersecurity':'Cybersecurity', 'google-cloud':'Google Cloud',
             'large-language-models':'Language Models', 'artificial-intelligence':'AI'}.get(slug, name)
    folder = CONTENT / 'technologies' / slug
    slugs = ['introduction'] + [slugify(item['title']) for item in lessons[1:]]
    assert len(set(slugs)) == len(slugs), slug
    # These explicitly assigned course folders are fully authored by these helpers.
    # Remove an old generated lesson only when its title/slug was deliberately replaced.
    lesson_folder = folder / 'lessons'
    for previous in lesson_folder.glob('*.json'):
        if previous.stem not in slugs:
            previous.resolve().relative_to((CONTENT / 'technologies' / slug).resolve())
            previous.unlink()
    overview = {
        'slug': slug,
        'description': introduction + ' This introductory course uses small examples and short practice tasks. Read the lessons in order, check the result, and try one change. Finishing these lessons gives you a starting point for further study.',
        'versionNote': 'Introductory examples. Read the setup note before using a separate tool.',
        'whatYouWillLearn': ['Explain ' + item['title'].lower() for item in lessons[1:6]],
        'learningObjectives': ['Practise ' + item['title'].lower() for item in lessons[6:10]],
        'sidebarCategories': [
            {'id':'first-steps','title':'First steps','lessonSlugs':slugs[:4]},
            {'id':'build-understanding','title':'Build your understanding','lessonSlugs':slugs[4:8]},
            {'id':'practise-carefully','title':'Practise and check','lessonSlugs':slugs[8:]},
        ],
        'seo': {'title': f'{short} Tutorial for Beginners', 'description': f'Learn {name} with clear steps, small examples and practice questions. Explore the basics at your own pace, then check what you learned.'[:170]},
    }
    save(folder/'overview.json', overview)
    exercises=[]; quizzes=[]; examples=[]; references=[]
    for i, (item, lesson_slug) in enumerate(zip(lessons, slugs)):
        ident = f'{slug}-{lesson_slug}'
        options=[item['answer'], item['wrong']]
        if i % 2: options.reverse()
        ex = dict(id=ident, lessonSlug=lesson_slug, difficulty='beginner', type='multiple-choice',
                  question=item['question'], options=options, correctIndex=options.index(item['answer']),
                  explanation=item['idea'] + ' ' + item['result'])
        exercises.append(ex)
        quiz=dict(ex, id=f'{slug}-quiz-{i+1}')
        quiz['question'] = item['question']
        quiz['options'] = list(reversed(options)); quiz['correctIndex']=quiz['options'].index(item['answer'])
        quizzes.append(quiz)
        runnable=item['language']=='javascript'
        blocks=[
            {'type':'heading','level':2,'text':'The idea'},
            {'type':'paragraph','text':item['idea']},
        ]
        if i == 0:
            blocks += [{'type':'callout','icon':'info-circle','title':'Before you start','text':setup},
                       {'type':'paragraph','text':f'This course teaches the basics. It does not cover every feature of {name}. Keep real personal data and secret keys out of practice files.'}]
        blocks += [
            {'type':'heading','level':2,'text':'Look at this example'},
            {'type':'code','language':item['language'],'code':item['code'], 'title':item['title'][:80], 'runnable':runnable},
            {'type':'paragraph','text':item['result']},
            {'type':'heading','level':2,'text':'Try one small change'},
            {'type':'list','ordered':True,'items':['Read the example from top to bottom. Point to the part that uses the new idea.', item['task'], 'Explain what changed in your own words. Check the example again if you get stuck.']},
            {'type':'alert','variant':'warning','title':'A common mistake','text':item['warning']},
            {'type':'exercise','exerciseId':ident},
            {'type':'paragraph','text':f'For more detail later, use this [{name} further reading]({docs}).'},
        ]
        summary=item['idea'][:197]
        if len(summary)<40: summary += ' Follow the small example and try the practice task.'
        intro=item['idea'] + ' We will use a small example so you can follow each step.'
        document=dict(schemaVersion=1,slug=lesson_slug,title=item['title'],summary=summary,
                      introduction=intro[:600],learningObjectives=[f"Explain {item['title'].lower()}", 'Use the example to answer a practice question'],blocks=blocks,
                      exerciseIds=[ident], relatedLessons=[{'technologySlug':slug,'slug':slugs[(i+1)%len(slugs)]}],
                      seo={'title':f"{short}: {item['title']}"[:70], 'description':f"Learn about {item['title'].lower()} in {name}. Follow a small example, understand the result, and practise with a clear question."[:170]}, updatedOn='2026-11-16')
        save(folder/'lessons'/f'{lesson_slug}.json', document)
        examples.append(dict(id=lesson_slug,title=item['title'][:80],description=item['idea'][:300],
                             language=item['language'],code=item['code'],runnable=runnable,tags=['beginner'],lessonSlug=lesson_slug))
        references.append(dict(slug=lesson_slug,name=item['title'][:60],summary=item['idea'][:300],
                               example={'language':item['language'],'code':item['code'][:2000]},
                               notes=[item['warning'][:240]],lessonSlug=lesson_slug))
    save(folder/'exercises.json',dict(title=f'{short} Exercises',description=f'Practise the ideas from this {name} course. Each answer has an explanation to help you learn.',exercises=exercises))
    save(folder/'quiz.json',dict(id=f'{slug}-quiz',title=f'{short} Quiz',description=f'Revisit the key ideas in {name}. Read each choice carefully. You can try the quiz again after reviewing the lessons.',passPercent=70,questions=quizzes))
    save(folder/'reference.json',dict(title=f'{short} Reference',description=f'A quick reminder of the ideas and examples in the {name} lessons. Open the linked lesson when you need more help.',groups=[{'id':'ideas','title':'Ideas and examples','entries':references}]))
    save(folder/'examples.json',dict(title=f'{short} Examples',description=f'Small {name} examples from the lessons. Each example links back to its explanation and practice task.',examples=examples))
    print(f'{slug}: {len(lessons)} lessons, {len(exercises)} exercises, {len(quizzes)} quiz questions')
