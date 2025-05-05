interface SudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
  difficulty: number;
  category: 'Easy' | 'Medium' | 'Hard' | 'Diabolical';
}

export class SudokuService {
  private static readonly DIFFICULTY_THRESHOLDS = {
    Easy: 1.5,
    Medium: 2.5,
    Hard: 5.0,
    Diabolical: Infinity
  };

  // Generate a new Sudoku puzzle with specified difficulty
  static generatePuzzle(difficulty: 'Easy' | 'Medium' | 'Hard' | 'Diabolical'): SudokuPuzzle {
    // Start with a solved board
    const solution = this.generateSolvedBoard();
    
    // Create a copy to work with
    const puzzle = solution.map(row => [...row]);
    
    // Remove numbers based on difficulty
    const cellsToRemove = this.getCellsToRemove(difficulty);
    this.removeNumbers(puzzle, cellsToRemove);
    
    // Calculate actual difficulty rating
    const rating = this.calculateDifficulty(puzzle);
    
    return {
      puzzle,
      solution,
      difficulty: rating,
      category: this.getDifficultyCategory(rating)
    };
  }

  // Generate a solved Sudoku board
  private static generateSolvedBoard(): number[][] {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    this.solveSudoku(board);
    return board;
  }

  // Solve a Sudoku puzzle using backtracking
  private static solveSudoku(board: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(board, row, col, num)) {
              board[row][col] = num;
              if (this.solveSudoku(board)) {
                return true;
              }
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  // Check if a move is valid
  private static isValidMove(board: number[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }

    return true;
  }

  // Get number of cells to remove based on difficulty
  private static getCellsToRemove(difficulty: string): number {
    switch (difficulty) {
      case 'Easy': return 30; // ~33% empty
      case 'Medium': return 40; // ~44% empty
      case 'Hard': return 50; // ~55% empty
      case 'Diabolical': return 60; // ~66% empty
      default: return 40;
    }
  }

  // Remove numbers from the board
  private static removeNumbers(board: number[][], count: number): void {
    let removed = 0;
    while (removed < count) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if (board[row][col] !== 0) {
        board[row][col] = 0;
        removed++;
      }
    }
  }

  // Calculate difficulty rating based on solving techniques needed
  private static calculateDifficulty(puzzle: number[][]): number {
    let rating = 1.0; // Base rating for basic techniques

    // Check for hidden singles (rating: 1.5)
    if (this.hasHiddenSingles(puzzle)) {
      rating = Math.max(rating, 1.5);
    }

    // Check for naked pairs (rating: 2.0)
    if (this.hasNakedPairs(puzzle)) {
      rating = Math.max(rating, 2.0);
    }

    // Check for X-Wing pattern (rating: 3.2)
    if (this.hasXWing(puzzle)) {
      rating = Math.max(rating, 3.2);
    }

    // Add random variation to make puzzles more interesting
    rating += Math.random() * 0.5;

    return rating;
  }

  // Get difficulty category based on rating
  private static getDifficultyCategory(rating: number): 'Easy' | 'Medium' | 'Hard' | 'Diabolical' {
    if (rating < this.DIFFICULTY_THRESHOLDS.Easy) return 'Easy';
    if (rating < this.DIFFICULTY_THRESHOLDS.Medium) return 'Medium';
    if (rating < this.DIFFICULTY_THRESHOLDS.Hard) return 'Hard';
    return 'Diabolical';
  }

  // Check for hidden singles (cells that can only contain one number)
  private static hasHiddenSingles(puzzle: number[][]): boolean {
    // Implementation of hidden singles detection
    return false; // Placeholder
  }

  // Check for naked pairs (two cells in a unit that can only contain the same two numbers)
  private static hasNakedPairs(puzzle: number[][]): boolean {
    // Implementation of naked pairs detection
    return false; // Placeholder
  }

  // Check for X-Wing pattern
  private static hasXWing(puzzle: number[][]): boolean {
    // Implementation of X-Wing pattern detection
    return false; // Placeholder
  }
}

export function generateSudokuPuzzle(difficulty: string): number[][] {
  // Use the SudokuService to generate a puzzle with the specified difficulty
  const puzzle = SudokuService.generatePuzzle(difficulty as 'Easy' | 'Medium' | 'Hard' | 'Diabolical');
  return puzzle.puzzle;
} 