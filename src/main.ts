import './style.css';
import { mountSpikePage } from './ui/spikePage';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('The page has no #app element.');
mountSpikePage(root);
