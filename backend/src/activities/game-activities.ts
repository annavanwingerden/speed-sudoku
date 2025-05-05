import { ActivityInterface } from '@temporalio/activity';

export interface GameActivities extends ActivityInterface {
  generatePuzzle(difficulty: string): Promise<number[][]>;
  validateMove(puzzle: number[][], move: { row: number; col: number; value: number }): Promise<boolean>;
}

export const gameActivities: GameActivities = {
  async generatePuzzle(difficulty: string): Promise<number[][]> {
    // Implement Sudoku puzzle generation based on difficulty
    // This is a placeholder that returns an empty 9x9 grid
    return Array(9).fill(null).map(() => Array(9).fill(0));
  },

  async validateMove(puzzle: number[][], move: { row: number; col: number; value: number }): Promise<boolean> {
    const { row, col, value } = move;
    
    // Check if the move is within bounds
    if (row < 0 || row >= 9 || col < 0 || col >= 9 || value < 1 || value > 9) {
      return false;
    }

    // Check if the cell is empty in the original puzzle
    if (puzzle[row][col] !== 0) {
      return false;
    }

    // Check row
    for (let i = 0; i < 9; i++) {
      if (puzzle[row][i] === value) {
        return false;
      }
    }

    // Check column
    for (let i = 0; i < 9; i++) {
      if (puzzle[i][col] === value) {
        return false;
      }
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (puzzle[boxRow + i][boxCol + j] === value) {
          return false;
        }
      }
    }

    return true;
  }
}; 