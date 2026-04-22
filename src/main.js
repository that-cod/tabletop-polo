import { Game } from './core/Game.js';

const canvas = document.getElementById('game-canvas');
const overlay = document.getElementById('overlay');

const game = new Game(canvas, overlay);
game.start();
