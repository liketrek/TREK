import { Component, type ReactNode } from 'react';
export default class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div style={{ padding: '3rem' }}>
        <h1>页面暂时无法打开</h1>
        <p>请刷新页面重试。已保存的备注仍保留在浏览器中。</p>
        <button onClick={() => location.reload()}>重新加载</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
