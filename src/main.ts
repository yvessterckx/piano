import './style.css';
import { mountPracticePage } from './ui/practicePage';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('The page has no #app element.');
mountPracticePage(root);
