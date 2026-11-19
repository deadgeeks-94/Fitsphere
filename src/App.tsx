import { useEffect, useMemo, useState } from 'react';
import { auth, api } from '@appdeploy/client';
import {
  Activity,
  ArrowRight,
  Award,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Home,
  LogOut,
  Menu,
  Moon,
  Play,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  UserRound,
  Waves,
  X,
  Zap,
} from 'lucide-react';

type User = { userId: string; name?: string; email?: string };
type ActivityLog = {
  id: string;
  title: string;
  minutes: number;
  category: string;
  completedAt: string;
};
type Workout = {
  id: string;
  title: string;
  category: string;
  minutes: number;
  level: string;
  description: string;
  exercises: string[];
  icon: string;
};

const workouts: Workout[] = [
  {
    id: 'morning-mobility',
    title: 'Morning mobility',
    category: 'Mobility',
    minutes: 12,
    level: 'All levels',
    description:
      'A gentle sequence to wake up your joints and prepare for the day.',
    exercises: [
      'Shoulder circles — 1 min',
      'Cat-cow stretch — 2 min',
      'Standing side reach — 2 min',
      'Hip circles — 2 min',
      'Easy full-body stretch — 5 min',
    ],
    icon: '🌿',
  },
  {
    id: 'bodyweight-basics',
    title: 'Bodyweight basics',
    category: 'Strength',
    minutes: 18,
    level: 'Beginner',
    description:
      'Build foundational strength with controlled, comfortable movements.',
    exercises: [
      'Chair squats — 2 sets',
      'Wall push-ups — 2 sets',
      'Glute bridges — 2 sets',
      'Bird dogs — 2 sets',
      'Easy cool-down — 3 min',
    ],
    icon: '💪',
  },
  {
    id: 'steady-cardio',
    title: 'Steady cardio',
    category: 'Cardio',
    minutes: 20,
    level: 'All levels',
    description: 'A low-impact session you can adapt to your own pace.',
    exercises: [
      'Easy warm-up walk — 4 min',
      'Brisk walk or march — 10 min',
      'Gentle pace — 3 min',
      'Cool-down walk — 3 min',
    ],
    icon: '🚶',
  },
  {
    id: 'recovery-reset',
    title: 'Recovery reset',
    category: 'Recovery',
    minutes: 10,
    level: 'All levels',
    description: 'Relaxed breathing and stretching for a lighter day.',
    exercises: [
      'Slow breathing — 2 min',
      'Neck and shoulder release — 2 min',
      'Hamstring stretch — 2 min',
      'Calf stretch — 2 min',
      'Quiet rest — 2 min',
    ],
    icon: '☁️',
  },
  {
    id: 'core-control',
    title: 'Core control',
    category: 'Strength',
    minutes: 14,
    level: 'Beginner',
    description:
      'Practice balance and trunk stability with gentle, controlled exercises.',
    exercises: [
      'Dead bug — 2 sets',
      'Bird dog — 2 sets',
      'Knee plank — 2 short holds',
      'Child’s pose — 2 min',
    ],
    icon: '⚡',
  },
  {
    id: 'walk-and-unwind',
    title: 'Walk & unwind',
    category: 'Cardio',
    minutes: 15,
    level: 'All levels',
    description: 'An easy outdoor walk with a relaxed finish.',
    exercises: [
      'Comfortable walk — 12 min',
      'Gentle calf stretch — 1 min',
      'Slow breathing — 2 min',
    ],
    icon: '🌤️',
  },
];

const categories = ['All', 'Strength', 'Cardio', 'Mobility', 'Recovery'];
const today = () => new Date().toISOString().slice(0, 10);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('Home');
  const [filter, setFilter] = useState('All');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selected, setSelected] = useState<Workout | null>(null);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customMinutes, setCustomMinutes] = useState('15');
  const [customCategory, setCustomCategory] = useState('Cardio');

  useEffect(() => {
    let active = true;
    auth
      .getUser()
      .then(found => {
        if (active) setUser(found);
      })
      .catch(() => {
        if (active)
          setAuthError(
            'We could not restore your session. Please try signing in again.'
          );
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const response = await api.get('/api/activities');
      setLogs(response.data.items || []);
    } catch {
      setNotice('Activity history could not be loaded. Please try again.');
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  const todayLogs = useMemo(
    () => logs.filter(log => log.completedAt?.slice(0, 10) === today()),
    [logs]
  );
  const todayMinutes = todayLogs.reduce((sum, log) => sum + log.minutes, 0);
  const weekMinutes = logs
    .filter(
      log => Date.now() - new Date(log.completedAt).getTime() < 7 * 86400000
    )
    .reduce((sum, log) => sum + log.minutes, 0);
  const displayName =
    user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  async function signIn() {
    setAuthError('');
    try {
      await auth.signInWithRedirect();
    } catch {
      setAuthError(
        'Sign-in could not start. Check your browser storage and try again.'
      );
    }
  }

  async function signOut() {
    await auth.signOut();
    setUser(null);
    setLogs([]);
    setTab('Home');
  }

  async function saveActivity(
    title: string,
    minutes: number,
    category: string
  ) {
    setSaving(true);
    setNotice('');
    try {
      const response = await api.post('/api/activities', {
        title,
        minutes,
        category,
      });
      setLogs(current => [{ ...response.data.activity }, ...current]);
      setSelected(null);
      setShowLogForm(false);
      setCustomTitle('');
      setNotice('Activity saved. Nice work showing up for yourself.');
      setTab('Activity');
    } catch {
      setNotice('Could not save this activity. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading)
    return (
      <div className="loading-screen">
        <div className="brand-mark">
          <Activity />
        </div>
        <p>Getting your space ready…</p>
      </div>
    );

  if (!user)
    return (
      <main className="auth-screen">
        <div className="auth-glow" />
        <div className="auth-content">
          <div className="brand-lockup">
            <div className="brand-mark">
              <Activity />
            </div>
            <span>FitSphere</span>
          </div>
          <div className="auth-copy">
            <span className="eyebrow">YOUR WELLNESS, YOUR PACE</span>
            <h1>
              Make room
              <br />
              for <em>movement.</em>
            </h1>
            <p>
              A calmer way to plan activity, build consistency and take care of
              your wellbeing.
            </p>
          </div>
          <div className="auth-benefits">
            <div>
              <CheckCircle2 />
              <span>Flexible plans for different energy levels</span>
            </div>
            <div>
              <ShieldCheck />
              <span>Your activity history stays private</span>
            </div>
            <div>
              <Heart />
              <span>Progress without appearance pressure</span>
            </div>
          </div>
          {authError && <p className="error-message">{authError}</p>}
          <button className="primary-button auth-button" onClick={signIn}>
            Continue securely <ArrowRight size={18} />
          </button>
          <p className="legal-note">
            By continuing, you agree to use FitSphere as a wellness tool, not a
            substitute for professional medical advice.
          </p>
        </div>
      </main>
    );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Activity />
          </div>
          <span>FitSphere</span>
        </div>
        <div className="topbar-actions">
          <span className="today-label">
            <span className="online-dot" /> YOUR SPACE
          </span>
          <button
            className="icon-button"
            aria-label="Profile settings"
            onClick={() => setTab('Profile')}
          >
            <UserRound size={19} />
          </button>
        </div>
      </header>

      <main className="main-content">
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        {tab === 'Home' && (
          <>
            <section className="welcome-row">
              <div>
                <span className="eyebrow">YOUR DAILY CHECK-IN</span>
                <h1>
                  Good day, {displayName} <span>✦</span>
                </h1>
                <p>Small, steady steps count. Choose what feels right today.</p>
              </div>
              <div className="date-chip">
                <CalendarDays size={15} />
                {new Date().toLocaleDateString('en', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </section>
            <section className="hero-card">
              <div className="hero-copy">
                <span className="hero-kicker">
                  <Sparkles size={14} /> A LITTLE PROGRESS, OFTEN
                </span>
                <h2>
                  Move well.
                  <br />
                  <em>Feel present.</em>
                </h2>
                <p>There’s no perfect pace. Start where you are.</p>
                <button
                  className="hero-button"
                  onClick={() => setTab('Workouts')}
                >
                  Explore workouts <ArrowRight size={16} />
                </button>
              </div>
              <div className="hero-art">
                <div className="art-orbit orbit-one" />
                <div className="art-orbit orbit-two" />
                <div className="art-center">
                  <Activity size={46} />
                </div>
                <span className="art-spark spark-one">✳</span>
                <span className="art-spark spark-two">✦</span>
              </div>
            </section>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon mint">
                  <Clock3 size={18} />
                </div>
                <span className="stat-label">TODAY'S MOVEMENT</span>
                <strong>
                  {todayMinutes}
                  <small> min</small>
                </strong>
                <span className="stat-foot">
                  {todayLogs.length} activities logged
                </span>
              </div>
              <div className="stat-card">
                <div className="stat-icon lilac">
                  <TrendingUp size={18} />
                </div>
                <span className="stat-label">THIS WEEK</span>
                <strong>
                  {weekMinutes}
                  <small> min</small>
                </strong>
                <span className="stat-foot">Across your recent activity</span>
              </div>
            </section>
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">A GOOD PLACE TO BEGIN</span>
                  <h2>Picked for today</h2>
                </div>
                <button
                  className="text-link"
                  onClick={() => setTab('Workouts')}
                >
                  See all <ArrowRight size={15} />
                </button>
              </div>
              <div
                className="featured-workout"
                onClick={() => setSelected(workouts[0])}
                role="button"
                tabIndex={0}
              >
                <div className="workout-emoji">{workouts[0].icon}</div>
                <div className="featured-info">
                  <span className="category-label">
                    MOBILITY · {workouts[0].minutes} MIN
                  </span>
                  <h3>{workouts[0].title}</h3>
                  <p>{workouts[0].description}</p>
                </div>
                <ChevronRight className="muted-chevron" />
              </div>
            </section>
            <section className="quote-card">
              <div className="quote-icon">
                <Heart size={18} />
              </div>
              <div>
                <strong>Rest is part of the plan.</strong>
                <p>
                  Listen to your body. Taking an easier day is a valid choice.
                </p>
              </div>
            </section>
          </>
        )}

        {tab === 'Workouts' && (
          <>
            <section className="page-heading">
              <span className="eyebrow">FIND YOUR FLOW</span>
              <h1>Move your way.</h1>
              <p>Pick a session that suits your time and energy today.</p>
            </section>
            <div className="filter-row">
              {categories.map(item => (
                <button
                  key={item}
                  className={
                    filter === item ? 'filter-chip active' : 'filter-chip'
                  }
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="workout-list">
              {workouts
                .filter(item => filter === 'All' || item.category === filter)
                .map(workout => (
                  <article className="workout-card" key={workout.id}>
                    <div className="workout-emoji">{workout.icon}</div>
                    <div className="workout-card-info">
                      <span className="category-label">
                        {workout.category.toUpperCase()} · {workout.minutes} MIN
                      </span>
                      <h3>{workout.title}</h3>
                      <p>{workout.description}</p>
                      <div className="workout-meta">
                        <span>
                          <Clock3 size={13} />
                          {workout.minutes} min
                        </span>
                        <span>
                          <Sparkles size={13} />
                          {workout.level}
                        </span>
                      </div>
                    </div>
                    <button
                      className="round-arrow"
                      onClick={() => setSelected(workout)}
                      aria-label={'View ' + workout.title}
                    >
                      <ArrowRight size={17} />
                    </button>
                  </article>
                ))}
            </div>
            <p className="safety-note">
              <ShieldCheck size={16} /> Adapt every movement to your comfort.
              Stop if you feel pain, dizziness or unwell.
            </p>
          </>
        )}

        {tab === 'Activity' && (
          <>
            <section className="page-heading activity-heading">
              <div>
                <span className="eyebrow">YOUR JOURNEY</span>
                <h1>Activity log.</h1>
                <p>Notice your consistency, not perfection.</p>
              </div>
              <button
                className="primary-button small-button"
                onClick={() => setShowLogForm(true)}
              >
                <Plus size={17} /> Log activity
              </button>
            </section>
            <div className="activity-summary">
              <div>
                <span className="stat-label">THIS WEEK</span>
                <strong>
                  {weekMinutes}
                  <small> min</small>
                </strong>
                <p>Time spent moving</p>
              </div>
              <div className="summary-decoration">
                <Activity size={32} />
              </div>
            </div>
            {showLogForm && (
              <form
                className="log-form"
                onSubmit={event => {
                  event.preventDefault();
                  const mins = Number(customMinutes);
                  if (
                    customTitle.trim() &&
                    Number.isInteger(mins) &&
                    mins >= 1 &&
                    mins <= 240
                  )
                    saveActivity(customTitle.trim(), mins, customCategory);
                }}
              >
                <div className="form-top">
                  <strong>Record an activity</strong>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowLogForm(false)}
                  >
                    <X size={17} />
                  </button>
                </div>
                <label>
                  Activity name
                  <input
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    maxLength={70}
                    placeholder="e.g. Evening walk"
                    required
                  />
                </label>
                <div className="form-two">
                  <label>
                    Minutes
                    <input
                      type="number"
                      min="1"
                      max="240"
                      value={customMinutes}
                      onChange={e => setCustomMinutes(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Type
                    <select
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                    >
                      <option>Cardio</option>
                      <option>Strength</option>
                      <option>Mobility</option>
                      <option>Recovery</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>
                <button
                  className="primary-button full-button"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save activity'}
                </button>
              </form>
            )}
            <div className="section-heading log-heading">
              <div>
                <span className="eyebrow">RECENT SESSIONS</span>
                <h2>Your activity</h2>
              </div>
              <button className="text-link" onClick={loadLogs}>
                {logsLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            {logsLoading ? (
              <div className="empty-state">Loading your activity…</div>
            ) : logs.length ? (
              <div className="log-list">
                {logs.map(log => (
                  <div className="log-item" key={log.id}>
                    <div className="log-check">
                      <Check size={17} />
                    </div>
                    <div className="log-info">
                      <strong>{log.title}</strong>
                      <span>
                        {log.category} ·{' '}
                        {new Date(log.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <b>{log.minutes} min</b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <Footprints size={25} />
                </div>
                <strong>Your story starts with one step.</strong>
                <p>Log a walk, stretch or workout to see it here.</p>
                <button
                  className="text-link"
                  onClick={() => setShowLogForm(true)}
                >
                  Add your first activity <ArrowRight size={14} />
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'Profile' && (
          <>
            <section className="page-heading">
              <span className="eyebrow">YOUR ACCOUNT</span>
              <h1>Your space.</h1>
              <p>Personal settings and a few helpful reminders.</p>
            </section>
            <div className="profile-card">
              <div className="profile-avatar">
                <UserRound size={26} />
              </div>
              <div>
                <strong>{user.name || 'FitSphere member'}</strong>
                <span>{user.email || 'Signed in securely'}</span>
              </div>
              <CheckCircle2 className="verified-icon" />
            </div>
            <div className="settings-list">
              <div className="setting-row">
                <div className="setting-icon">
                  <Bell size={18} />
                </div>
                <div>
                  <strong>Movement reminders</strong>
                  <p>Coming soon — optional reminders you control.</p>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Private activity history</strong>
                  <p>Your saved activities are tied to your account.</p>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-icon">
                  <Heart size={18} />
                </div>
                <div>
                  <strong>Wellbeing first</strong>
                  <p>Rest, recovery and gentle days belong here too.</p>
                </div>
              </div>
            </div>
            <button className="signout-button" onClick={signOut}>
              <LogOut size={17} /> Sign out
            </button>
            <p className="legal-note profile-legal">
              FitSphere offers general wellness information. It does not
              diagnose, treat or replace advice from a qualified health
              professional.
            </p>
          </>
        )}
      </main>

      <nav className="bottom-nav">
        {[
          { name: 'Home', icon: Home },
          { name: 'Workouts', icon: Dumbbell },
          { name: 'Activity', icon: Activity },
          { name: 'Profile', icon: UserRound },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={tab === name ? 'nav-item active' : 'nav-item'}
            onClick={() => setTab(name)}
          >
            <Icon size={20} />
            <span>{name}</span>
          </button>
        ))}
      </nav>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section className="workout-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <button
              className="modal-close icon-button"
              onClick={() => setSelected(null)}
            >
              <X size={19} />
            </button>
            <div className="modal-emoji">{selected.icon}</div>
            <span className="eyebrow">
              {selected.category.toUpperCase()} · {selected.minutes} MINUTES
            </span>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
            <div className="exercise-list">
              <strong>Session outline</strong>
              {selected.exercises.map((exercise, index) => (
                <div className="exercise-row" key={exercise}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {exercise}
                </div>
              ))}
            </div>
            <p className="modal-safety">
              Move at a comfortable pace. Skip or adapt any exercise that does
              not feel right.
            </p>
            <button
              className="primary-button full-button"
              disabled={saving}
              onClick={() =>
                saveActivity(
                  selected.title,
                  selected.minutes,
                  selected.category
                )
              }
            >
              <CheckCircle2 size={18} />
              {saving ? 'Saving…' : 'Mark session complete'}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
