// === 替换 App.tsx 里的 RenderHero ===
const RenderHero: React.FC<{ data: any }> = ({ data }) => {
  // 1) 读取并兜底
  const title: string = data?.title ?? '';
  const kicker: string = data?.kicker ?? '';
  const authorLine: string = data?.authorLine ?? '';
  const standfirst: string = data?.standfirst ?? '';

  const alignment: 'left' | 'center' | 'right' =
    (data?.alignment as any) === 'center'
      ? 'center'
      : (data?.alignment as any) === 'right'
      ? 'right'
      : 'left';

  const titleSize: string = data?.titleSize || '36px';
  const standfirstSize: string = data?.standfirstSize || '18px';

  const textColor: string = data?.textColor || '#111827';
  const titleColor: string = data?.titleColor || textColor;
  const standfirstColor: string = data?.standfirstColor || '#4b5563';

  const backgroundColor: string = data?.backgroundColor || '#ffffff';
  const minHeight: string | undefined = data?.height || undefined;

  // 2) 布局与对齐：容器背景 + 文字主色；内部卡片宽度限制并根据 alignment 决定左右留白
  const sectionStyle: React.CSSProperties = {
    background: backgroundColor,
    color: textColor,
    borderBottom: '1px solid #eee',
    padding: '32px 20px',
    minHeight,
    display: 'flex',
    alignItems: 'center',
  };

  const innerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 980,
    margin:
      alignment === 'center' ? '0 auto' : alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0',
    textAlign: alignment,
  };

  // 3) 各字段样式
  const kickerStyle: React.CSSProperties = {
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.9,
    marginBottom: 8,
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 800,
    fontSize: titleSize,
    lineHeight: 1.15,
    color: titleColor,
    margin: '0 0 10px',
  };

  const standfirstStyle: React.CSSProperties = {
    fontSize: standfirstSize,
    color: standfirstColor,
    margin: '0 0 10px',
  };

  const authorStyle: React.CSSProperties = {
    fontSize: 14,
    opacity: 0.85,
    marginTop: 6,
  };

  return (
    <section style={sectionStyle}>
      <div style={innerStyle}>
        {kicker && <div style={kickerStyle}>{kicker}</div>}
        {title && <h1 style={titleStyle}>{title}</h1>}
        {standfirst && <p style={standfirstStyle}>{standfirst}</p>}
        {authorLine && <div style={authorStyle}>{authorLine}</div>}
      </div>
    </section>
  );
};
