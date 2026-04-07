import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Activity,
  ArrowRight,
  KeyRound,
  Mail,
  Radar,
  ShieldCheck,
  User2,
} from 'lucide-react';
import {
  useLoginMutation,
  useRegisterMutation,
} from '@/store/api/authApi';
import { setCredentials } from '@/store/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LogoWithText } from '@/components/Logo';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loginMutation, { isLoading: loginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: registerLoading }] = useRegisterMutation();
  const loading = loginLoading || registerLoading;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const response = await loginMutation({ username, password }).unwrap();
        if (response.code === 200) {
          localStorage.setItem('token', response.data.token);
          dispatch(
            setCredentials({
              user: response.data.user,
              token: response.data.token,
            }),
          );
          navigate('/');
        }
      } else {
        const response = await registerMutation({ username, password, email }).unwrap();
        if (response.code === 201) {
          localStorage.setItem('token', response.data.token);
          const user = {
            ...response.data.user,
            avatar: '',
            role: 'user',
          };
          dispatch(
            setCredentials({
              user,
              token: response.data.token,
            }),
          );
          navigate('/');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(circle at top left, rgb(var(--accent) / 0.16), transparent 24%)',
            'radial-gradient(circle at 85% 15%, rgb(var(--accent) / 0.09), transparent 18%)',
            'linear-gradient(180deg, rgb(var(--canvas)) 0%, rgb(var(--surface-subtle)) 100%)',
          ].join(','),
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between px-6 py-8 md:px-12 lg:px-16">
          <LogoWithText size="lg" showSubtitle />

          <div className="max-w-2xl py-10">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-text-tertiary">
              安全接入
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-text-primary md:text-5xl">
              进入统一巡检控制台
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
              登录后直接进入新的工作台壳层，在同一套界面里完成监控、AI 协作、告警处置和系统治理。
            </p>

            <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_280px]">
              <div className="surface-float rounded-[32px] p-6">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-text-tertiary">
                      控制范围
                    </p>
                    <p className="mt-2 text-sm text-text-secondary">
                      当前系统入口已经和新版控制台保持同一套语言。
                    </p>
                  </div>
                  <span className="rounded-full bg-success/12 px-3 py-1.5 text-xs font-medium text-success">
                    状态稳定
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {[
                    { title: '监控联动', value: '视频墙与事件流', icon: Radar },
                    { title: 'AI 协作', value: '摘要、分析与派单', icon: Activity },
                    { title: '治理配置', value: '角色、策略与审计', icon: ShieldCheck },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-[22px] border border-border bg-bg-surface px-4 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm text-text-primary">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="surface-panel rounded-[32px] p-6">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-text-tertiary">
                  接入说明
                </p>
                <div className="mt-5 space-y-3">
                  {[
                    '高影响操作统一保留审计记录',
                    '入口页已对齐双主题控制台体系',
                    '登录后保持当前工作区上下文',
                  ].map((item) => (
                    <div key={item} className="rounded-[18px] bg-bg-surface px-4 py-3 text-sm text-text-secondary">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-sm text-text-secondary lg:flex">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>所有关键操作都会保留审计记录与权限边界。</span>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-8 md:px-12">
          <div className="surface-float w-full max-w-[30rem] rounded-[36px] p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-text-tertiary">
                  {isLogin ? '账号登录' : '创建账号'}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-text-primary">
                  {isLogin ? '登录账号' : '注册账号'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {isLogin
                    ? '继续进入你的控制台工作区。'
                    : '创建一个新账号并直接进入新的工作台。'}
                </p>
              </div>
              <div className="rounded-[20px] border border-border bg-bg-surface px-4 py-3 text-right">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-text-tertiary">
                  当前环境
                </p>
                <p className="mt-2 text-sm font-medium text-text-primary">本地预览</p>
              </div>
            </div>

            <div className="mt-6 inline-flex rounded-full border border-border bg-bg-surface p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-normal ${
                  isLogin ? 'bg-accent text-white shadow-panel' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-normal ${
                  !isLogin ? 'bg-accent text-white shadow-panel' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                注册
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="用户名"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                prefix={<User2 className="h-4 w-4" />}
                hint={isLogin ? '使用你的工作台账号登录' : '建议使用易识别的运营账号名'}
                required
              />

              {!isLogin && (
                <Input
                  label="邮箱"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  prefix={<Mail className="h-4 w-4" />}
                  required
                />
              )}

              <Input
                label="密码"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                prefix={<KeyRound className="h-4 w-4" />}
                required
              />

              {error && (
                <div className="rounded-[22px] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                  {error}
                </div>
              )}

              <div className="rounded-[24px] border border-border bg-bg-surface px-4 py-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-success" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {isLogin ? '登录后恢复你的工作区上下文' : '注册后直接进入系统首页'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      前端不会修改任何后端认证协议，本轮仅更新入口视觉和表单组织。
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                <span>{loading ? '处理中…' : isLogin ? '登录并进入工作台' : '注册并进入工作台'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-[22px] border border-border bg-bg-surface px-4 py-4 text-sm text-text-secondary">
              <span>{isLogin ? '还没有账号？' : '已有账号？'}</span>
              <button
                type="button"
                onClick={() => setIsLogin((current) => !current)}
                className="font-medium text-accent transition-colors hover:text-accent-hover"
              >
                {isLogin ? '立即注册' : '返回登录'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
