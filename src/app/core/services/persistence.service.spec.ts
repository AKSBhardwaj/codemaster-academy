import { TestBed } from '@angular/core/testing';
import { PersistenceService } from './persistence.service';

describe('local learning data', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('removes old credentials without removing saved learning work', () => {
    localStorage.setItem('cma:v1:auth:accounts', '[{"passwordHash":"old-hash"}]');
    localStorage.setItem('cma:v1:auth:session', '"old-session"');
    localStorage.setItem('cma:v1:progress:completed', '{"html":["introduction"]}');
    const persistence = TestBed.inject(PersistenceService);
    expect(localStorage.getItem('cma:v1:auth:accounts')).toBeNull();
    expect(localStorage.getItem('cma:v1:auth:session')).toBeNull();
    expect(persistence.read('progress:completed', {})).toEqual({ html: ['introduction'] });
  });

  it('exports only this application data and clears no unrelated settings', () => {
    localStorage.setItem('unrelated', 'keep');
    const persistence = TestBed.inject(PersistenceService);
    persistence.write('learner:nickname', 'Star Coder');
    persistence.write('auth:old-secret', 'excluded');
    expect(persistence.snapshot()).toEqual({ 'learner:nickname': 'Star Coder' });
    persistence.clearAll();
    expect(localStorage.getItem('unrelated')).toBe('keep');
    expect(persistence.snapshot()).toEqual({});
  });

  it('keeps the application usable when browser storage is blocked', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const persistence = TestBed.inject(PersistenceService);
    expect(persistence.read('progress:completed', {})).toEqual({});
    expect(persistence.write('learner:nickname', 'Star Coder')).toBe(false);
    expect(() => persistence.remove('learner:nickname')).not.toThrow();
    get.mockRestore();
    set.mockRestore();
    remove.mockRestore();
  });
});
