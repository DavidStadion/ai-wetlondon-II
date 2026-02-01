import { render } from 'preact';
import { App } from './App';
import './styles/global.css';

const container = document.getElementById('preact-root');
if (container) {
  render(<App />, container);
}
