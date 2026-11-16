from pathlib import Path
import json, re, runpy, hashlib, copy
ROOT = Path(__file__).resolve().parents[2] / 'src/assets/content/technologies'
COURSES = []
WALKTHROUGHS = {}
def lesson(slug, title, explanation, code, result, practice, mistake):
    return dict(slug=slug, title=title, explanation=explanation, code=code, result=result, practice=practice, mistake=mistake)
def course(slug, name, language, version, setup, about, lessons):
    assert len(lessons) == 12, (slug, len(lessons))
    COURSES.append(dict(slug=slug, name=name, language=language, version=version, setup=setup, about=about, lessons=lessons))
def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
def trim(text, limit):
    if len(text) <= limit: return text
    return text[:limit-1].rsplit(' ', 1)[0].rstrip(' ,;:.') + '.'
def alternate_text(value):
    replacements = {
        'Asha': 'Ravi', 'Ravi': 'Asha', 'ASHA': 'RAVI', 'Moon Trip': 'Sun Trip',
        'Oak School': 'Pine School', 'blue': 'red', 'red': 'blue', 'cat': 'dog',
        'dog': 'cat', 'Guest': 'Asha', 'Pass': 'Try again', 'Ready': 'Waiting',
        'ready': 'waiting', 'Go': 'Stop', 'Welcome': 'Hello', 'Closed': 'Open',
        'Book not found': 'Title needed', 'Page not found': 'Home',
        'Practice note': 'Welcome', 'Try again later': 'Book not found',
        'Message needed': 'Valid JSON', 'Use valid JSON': 'Valid JSON',
        'Still here': 'Done', 'Hello again': 'Hello', 'Same text': 'Different',
    }
    for old, new in replacements.items():
        if old in value: return value.replace(old, new, 1)
    return value.upper() if value != value.upper() else value.lower()
def mutate_value(value, delta=1):
    if isinstance(value, bool): return not value
    if isinstance(value, (int, float)): return value + delta
    if isinstance(value, str): return alternate_text(value)
    if isinstance(value, list):
        if not value: return [0]
        out = copy.deepcopy(value)
        out[0] = mutate_value(out[0], delta)
        return out
    if isinstance(value, dict):
        out = copy.deepcopy(value)
        if not out: return {'value': 0}
        key = next(iter(out))
        out[key] = mutate_value(out[key], delta)
        return out
    return 0
def answer_choices(result):
    """Plausible predictions based on this result's values, shape and order."""
    candidates = []
    if result.lower() in ('true', 'false'):
        other = 'false' if result.lower() == 'true' else 'true'
        return [result, other.capitalize() if result[0].isupper() else other]
    try:
        value = json.loads(result)
        candidates.append(json.dumps(mutate_value(value), separators=(',', ':')))
        if isinstance(value, dict):
            candidates.append(json.dumps(list(value.values()), separators=(',', ':')))
        elif isinstance(value, list):
            candidates.append(json.dumps(value[::-1] if len(value) > 1 else [], separators=(',', ':')))
        elif isinstance(value, (int, float)):
            candidates.append(str(value - 1))
        else:
            candidates.append(json.dumps(mutate_value(value, 2), separators=(',', ':')))
    except (ValueError, TypeError):
        if result.startswith('Cannot return null'):
            candidates += ['{"name":null}', '{"name":"Guest"}']
        elif result.startswith('204 '):
            candidates += ['200 OK; body: {"removed":true}', '404 Not Found; empty body']
        elif re.search(r'\d', result):
            candidates.append(re.sub(r'\d+', lambda m: str(int(m.group()) + 1), result, count=1))
            if '\n' in result: candidates.append('\n'.join(result.splitlines()[::-1]))
            else: candidates.append(re.sub(r'\d+', '0', result, count=1))
        else:
            candidates += [alternate_text(result), result.lower(), result.upper()]
            if ', ' in result: candidates.append(result.split(', ', 1)[-1].rstrip('!'))
            elif ' ' in result: candidates.append(result.split()[0])
    choices = [result]
    for item in candidates:
        if item not in choices and len(item) <= 200:
            choices.append(item)
        if len(choices) == 3: break
    if len(choices) < 2:
        choices.append('""')
    return choices
def write_course(c):
    dest = ROOT / c['slug']
    # The helper only owns the new courses declared in its data files.
    names = [x['slug'] for x in c['lessons']]
    assert len(set(names)) == 12
    description = f"{c['about']} These 12 starter lessons use small examples and simple words. Read the result, make one small change, and try the practice question. {c['setup']}"
    categories = [dict(id='first-steps', title='First steps', lessonSlugs=names[:4]), dict(id='use-the-idea', title='Use the idea', lessonSlugs=names[4:8]), dict(id='next-steps', title='Next steps', lessonSlugs=names[8:])]
    overview = dict(slug=c['slug'], description=trim(description,900), versionNote=trim(c['version'],200), whatYouWillLearn=[trim(l['title'] + ' with ' + c['name'], 140) for l in c['lessons'][::3]], learningObjectives=[trim(l['title'] + ' with ' + c['name'], 160) for l in c['lessons'][::4]], sidebarCategories=categories, seo=dict(title=trim(c['name']+' Tutorial: 12 Small First Steps',60),description=trim(description,160)))
    save(dest/'overview.json', overview)
    exercises=[]; examples=[]; references=[]
    for i,l in enumerate(c['lessons']):
        exercise_id = c['slug']+'-'+l['slug']+'-check'
        summary=trim(c['name'] + ': ' + l['title'] + '. ' + l['practice'],190)
        if len(summary)<40: summary += ' Try a small example and check what happens.'
        intro=l['explanation']
        if len(intro) < 60: intro += ' Read the example, then check the result.'
        walkthrough = WALKTHROUGHS[c['slug']][i]
        answers=answer_choices(l['result'])
        # Vary answer positions so the quiz does not teach a location pattern.
        shift=int(hashlib.sha256(exercise_id.encode()).hexdigest()[:4],16)%len(answers)
        choices=answers[shift:]+answers[:shift]
        q=dict(id=exercise_id,lessonSlug=l['slug'],difficulty='beginner',type='predict-output',language=c['language'],code=l['code'],question=trim(l['explanation'] + ' What result does this example give after the setup steps?', 590),explanation=walkthrough+' '+l['mistake'],options=choices,correctIndex=(-shift)%len(answers))
        exercises.append(q)
        blocks=[dict(type='heading',level=2,text='Before you start'),dict(type='paragraph',text=c['setup']),dict(type='heading',level=2,text=l['title']),dict(type='code',language=c['language'],title=l['title'],code=l['code'],runnable=False),dict(type='heading',level=3,text='How the example works'),dict(type='paragraph',text=walkthrough),dict(type='output',kind='text',title='Expected result',content=l['result']),dict(type='heading',level=2,text='Try a small change'),dict(type='paragraph',text=l['practice']),dict(type='alert',variant='warning',title='Watch out',text=l['mistake']),dict(type='exercise',exerciseId=exercise_id)]
        related = names[i-1] if i else names[1]
        first_objective=l['title'] + ' with ' + c['name']
        if first_objective.startswith('A first'): first_objective='Write ' + first_objective.lower()
        second_objective=l['practice'].rstrip('.')
        if len(second_objective)<10: second_objective += ' in the example'
        d=dict(schemaVersion=1,slug=l['slug'],title=l['title'],summary=summary,introduction=trim(intro,590),learningObjectives=[trim(first_objective,140),trim(second_objective,140)],blocks=blocks,exerciseIds=[exercise_id],relatedLessons=[dict(technologySlug=c['slug'],slug=related)],seo=dict(title=trim(c['name']+': '+l['title'],60),description=trim(summary+' Follow a small example and practise the idea.',160)),updatedOn='2026-11-16')
        save(dest/'lessons'/f"{l['slug']}.json", d)
        examples.append(dict(id=l['slug'],title=l['title'],description=trim(l['explanation'],280),language=c['language'],code=l['code'],output=l['result'],runnable=False,tags=['starter','practice'],lessonSlug=l['slug']))
        references.append(dict(slug=l['slug'],name=l['title'],summary=trim(l['explanation'],290),example=dict(language=c['language'],code=l['code'][:2000]),notes=[trim(l['mistake'],230)],lessonSlug=l['slug']))
    save(dest/'exercises.json',dict(title=c['name']+' Exercises',description='Read each example in its lesson first. Predict the result, then check your answer. The notes explain the idea and one common mistake.',exercises=exercises))
    questions=[]
    for i,q in enumerate(exercises):
        review=dict(q); review['id']=c['slug']+'-review-'+str(i+1); questions.append(review)
    save(dest/'quiz.json',dict(id=c['slug']+'-quiz',title=c['name']+' Quiz',description='Review the 12 starter lessons. The questions name the example to revisit. Take your time, use the lessons, and read the reason after each answer.',passPercent=70,questions=questions))
    save(dest/'examples.json',dict(title=c['name']+' Examples',description='Each example belongs to one starter lesson. Follow its setup steps before trying it. These examples need the named tools and do not run in this site playground.',examples=examples))
    save(dest/'reference.json',dict(title=c['name']+' Quick Reference',description='Look up a lesson idea, see its small example, and check a common mistake. Open the linked lesson for setup and practice steps.',groups=[dict(id='first-steps',title='First steps',entries=references[:4]),dict(id='use-the-idea',title='Use the idea',entries=references[4:8]),dict(id='next-steps',title='Next steps',entries=references[8:])]))
if __name__ == '__main__':
    for notes_file in sorted(Path(__file__).parent.glob('author-languages-notes-*.py')):
        WALKTHROUGHS.update(runpy.run_path(str(notes_file))['WALK'])
    for data_file in sorted(Path(__file__).parent.glob('author-languages-data-*.py')):
        runpy.run_path(str(data_file), init_globals=dict(course=course,L=lesson))
    assert set(WALKTHROUGHS) == {c['slug'] for c in COURSES}
    assert all(len(notes)==12 for notes in WALKTHROUGHS.values())
    for item in COURSES: write_course(item)
    print(f'Wrote {len(COURSES)} courses, {len(COURSES)*12} lessons, with matching practice sets.')
