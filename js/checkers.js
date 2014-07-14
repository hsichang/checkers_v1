// checklist:
//
// Double Jump
// Scoreboard
// Piece counter
// Game over
// Lobby
// Chat
// Single Player
// PubNub

$(document).ready(function() {
  var Checkers = function() {
    var self = this;
    self.$body = $('body');
    self.$board = $('#board');
    self.$player_1_move = $('#move_player_1');
    self.$player_2_move = $('#move_player_2');
    self.$debugSquareDisplay = $('#debug-display-square');

    self.players = {};
    self.players =  { 1 : new Player(1),
                      2 : new Player(2) };

    self.turn = null;
    self.bindEvents();
    self.moves = [];
  };


  var Board = function() {
    /*
     * Board
     *
     * currentSquare = square that is scoped to move
     *
     *
     */
    var self = this;


  };

  Board.prototype = {
    _highlightAvailableMoves : function(square) {
      var self = this;
      square.selected = true;
      if (square.availableMoves.length > 0) {
        // has moves
        for (var openSquare in square.availableMoves) {
          self.currentSquare = square;
          $('#'+square.availableMoves[openSquare].squareID).toggleClass('highlight');
        };
      }
    },

    _clearHighlights : function() {
      var self = this;
      self.currentSquare = null;
      $('.square').removeClass('highlight');
    },

    _initiateMove: function(toSquare, game) {
      var thisBoard     = this,
          players       = game.players,
          pieces        = 0,
          fromSquare    = thisBoard.currentSquare,
          recordOfMove  = {},
          moveData      = fromSquare._findMoveBySquareId(toSquare.name),
          newKing       = toSquare._checkKing(game);

      thisBoard.currentSquare = null;

      toSquare.selected = false;
      toSquare.occupied = true;
      toSquare.player   = fromSquare.player;
      toSquare.king     = (newKing) ? true : fromSquare.king;

      if (moveData.pieces) {
        pieces = moveData.pieces
        score = game._movePieces(thisBoard, moveData.pieces);
      };

      recordOfMove = {  from  : fromSquare.name,
                        to    : toSquare.name,
                        pieces: moveData.pieces,
                        take  : true,
                        score1: game.players[1].score,
                        score2: game.players[2].score };

      game.moves.push(recordOfMove);

      // remove player from fromSquare
      fromSquare._emptySquare();
      toSquare._populateSquare();

      // wipe at the end
      fromSquare.selected = false;                                    // move this to a clear function ()
      fromSquare.king = false;
      fromSquare.occupied = false;
      fromSquare.player = null;
      fromSquare.availableMoves = [];

      // sanity check at the end
      fromSquare._sane();
      toSquare._sane();
    },
  };
  /*
   * Player
   *
   * player: 1 or 2
   * pieces: number of pieces on board
   * score: number of pieces taken
   * moves: array of all moves,
   *    move number is implied: index + 1
   *    moves[ {  from: squareName,
   *              to  : squareName,
   *              take: take piece during move?
   *              pieces: numberOfPieces taken, 0 if take is false }, .. ]
   *
   * functions
   *
   * _addMove(fromSquare, toSquare, take, numberOfPieces) : adds move object to moves array
   *
   *
   *
   * _addScore(numberOfPieces) : increments self.score by numberOfPieces
   *    returns true -- if the player has won
   *    returns false -- no win, next move
   *
   * _losePieces(numberOfPieces) : reduces the number of pieces by number
   *
   *
   */

  var Player = function(player) {
    var self = this;

    self.player = player;
    self.score = 0;
    self.pieces = 16;
    self.moves = [];
  };

  Player.prototype = {
    _addMove: function(fromSquare, toSquare, take, numberOfPieces) {
      var self = this,
          move = { from: fromSquare, to: toSquare, take: take, pieces: numberOfPieces };

      self.moves.push(move);
    },

    _addScore: function(numberOfPieces) {
      var self = this;
      self.score = this.score+numberOfPieces;
      return (self.score >=12) ? true : false;
    },

    _losePieces: function(numberOfPieces) {
      var self = this;
      self.pieces = self.pieces - numberOfPieces();
    },

  }; /* end of player prototype */

  /* Piece may be deprecated */
  var Piece = function(player) {
    this.player = player;
  };

  /*
   * Square
   *
   *  name        : string
   *  selected    : boolean
   *  occupied    : boolean
   *  player      : integer
   *  king        : boolean
   *  avaliableMoves : array (array of square names it can highlight)
   *
   *  written functions
   *
   *  _sane
   *  _occupy - sets occupy to true
   *  _occupiedByPlayer(player) - returns true if occupied by player
   *  _isBlocked  : returns true if you can not move the piece
   *  _pieceDirection : returns the direction a piece moves (+/- 1)
   *  _playable : returns true if moves are available
   *  _active : returns true if highlit
   *
   *  _highlightAvailableMoves() : highlights available moves - this should probably go to a larger scope
   *
   *  write:
   *
   *  evaluateMoves : fills in availableMoves array
   *
   *
   */
  function Square(name) {
    /* modify function: if you update a square it should check if sane, */
    var self = this;
    self.name = name;
    self.king1 = false;
    self.king2 = false;
    self.selected = false;
    self.availableMoves = [];
  }

  Square.prototype = {
    _sane: function() {
      var self = this;
      var msgs = [];

      if (!self.occupied && self.selected) {
        msgs.push('Cannot be occupied and selected');
      };

      if (!self.occupied && self.king) {
        msgs.push('Cannot be king and occupied simultaneously');
      };

      if (self.isBlocked && self.availableMoves.length !== 0) {
        msgs.push('Can not be blocked and have available moves');
      }

      if (msgs.length !== 0) {
        alert(self.name + ' is insane');
        for (var msg in msgs) {
          console.log("\n"+msgs[msg]);
        };
      }
    },

    _active: function() {
      var self = this;
      return $('#'+self.name).hasClass('highlight');
    },

    _checkKing: function(game) {
      var thisSquare = this;
      return ( (game.turn === 1) && thisSquare.king1 || (game.turn === 2) && thisSquare.king2);
    },

    _occupy: function() {
      var self = this;
      self.occupy = true;
      self._sane(); // sanity check
    },

    _occupiedByPlayer: function(player) {
      var self = this;
      return self.player === player
    },

    _isBlocked: function() {
      var self = this;
      return self.availableMoves.length === 0;
    },

    _playable: function() {
      var self = this;
      return self.availableMoves.length !== 0;
    },

    _populateSquare: function() {
      var thisSquare = this,
          error_msg  = 'Error. '+thisSquare.name+' is not occupied.';

      if (thisSquare.occupied) {
        if (thisSquare.player === 1) {
          thisSquare.king ? $('#'+thisSquare.name).append('<div class="piece_1">K</div>') : $('#'+thisSquare.name).append('<div class="piece_1"></div>');
        } else if (thisSquare.player === 2) {
          thisSquare.king ? $('#'+thisSquare.name).append('<div class="piece_2">K</div>') : $('#'+thisSquare.name).append('<div class="piece_2"></div>');
        }
      } else {
        alert(error_msg);
        $('#'+thisSquare.name).children().remove();
        return false;
      };
    },

    _findMoveBySquareId: function(targetSquareId) {
      var thisSquare = this,
          allMoves = thisSquare.availableMoves;

      for (var move in thisSquare.availableMoves) {
        if (allMoves[move].squareID === targetSquareId) {
          return allMoves[move];
        };
      };

      return false;
    },

    _emptySquare: function() {
      var thisSquare = this,
          error_msg = 'Error.  This cell is not populated!'

      thisSquare.occupied ? $('#'+thisSquare.name).empty() : alert(error_msg);
    },

    _pieceDirection: function() {
      var thisSquare = this,
          kingModifier = thisSquare.king ? -1 : 1,
          direction = (thisSquare.player === 1) ? 1 : -1;

      return direction * kingModifier;
    },

    _constructMoves: function(coords, x_step, y_step, step, pieces) {
      var self    = this,
          next_x  = coords.col + x_step,
          next_y  = coords.row + y_step,
          take    = false;

      if ((next_x <= 8 && next_x >= 1) && (next_y >= 1 && next_y <= 8)) {
        if (step > 1) {
          take    = true;
          pieces  = pieces;
       };

      move = {  squareID    : "c"+next_x+"r"+next_y,
                step        : step,
                xDirection  : x_step,
                yDirection  : y_step,
                coords      : { col : next_x, row : next_y },
                next_x      : next_x,     // needed ?
                next_y      : next_y,     // needed ?
                take        : take,
                pieces      : pieces
              };

        return move;

      } else {
        return false;
      };
    },

    _occupiedByOpponent: function(player) {
      var self = this;

      return (self.occupied && (self.player !== player))
    },

    _evaluateMoves: function(board, p) {
      var thisSquare = this,
          squaresToCheck = [],
          x_dir = thisSquare._pieceDirection(),
          y_dir = [1, -1],
          step = 1;

      /*
       * look at where i am
       * (return location)
       *
       * check direction
       * (king === true?)
       *
       * go direction one
       * (right if not king 1)
       *
       * i go up one
       *
       *   check if free (playable ++)
       *   check if occupied by self (not playable)
       *   check if occupied by opponent (check for jump)

       * i go down one
       *
       */

      if (thisSquare.player === p) {
        for(var y_step in y_dir) {
          if (thisSquare._constructMoves(thisSquare.coords, x_dir, y_dir[y_step]) !== false) {
            squaresToCheck.push(thisSquare._constructMoves(thisSquare.coords, x_dir, y_dir[y_step], step));
          };
        }

        var exit = squaresToCheck.length;
        var square = 0; // change to index
        while (square < exit) {
          var pieces = [];
          step = 1;
          scope = board[squaresToCheck[square].squareID];

          if ( scope._occupiedByPlayer(p) || (scope._occupiedByOpponent(p) && (step % 2 === 0) ) ) {
            // do nothing
          } else if ( scope._occupiedByOpponent(p) ) {
            step = step + 1;
            if (step % 2 === 0) {     // single jump
              y_dir = scope.coords.row - thisSquare.coords.row;
              if (thisSquare._constructMoves(scope.coords, x_dir, y_dir, step)) {
                pieces.push(scope.name);
                squaresToCheck.push(thisSquare._constructMoves(scope.coords, x_dir, y_dir, step, pieces));
                exit = exit + 1;
              };
            } else {                   // for now for double jump

            };
          } else {                                                                    // has a move
          thisSquare.availableMoves.push(squaresToCheck[square]);
        };

        square = square + 1;  // increment loop;
        };  /* eo while (square < exit) loop */
      };
      thisSquare._sane();
    },
  };

  Checkers.prototype = {
    bindEvents: function() {
      var self = this,
          testing = true;

      if (testing) {
        self._toggleBoard("playing"); /* Starts the game */
        /*
        self.$board.mousemove(function(evt) {
          self._debug(evt, "display-square");
        });
        */
      };

    },

    _debug: function(evt, action) {
      var self = this,
          target = evt.target.id,
          $targetDiv = $('#' + target);

      if ($targetDiv.hasClass("legal") && action === "display-square") {
        self.$debugSquareDisplay.text("#"+target+" "+"classes: " + $targetDiv.attr("class"));
      } else {
        self.$debugSquareDisplay.text("");
      };
    },

    _movePieces: function(board, squares) {
      var thisGame    = this,
          score       = 0,
          totalScore  = 0;

      for(var square in squares) {

        board[squares[square]]._emptySquare();

        var score = 1;

        if (board[squares[square]].king) { var score = score + 2 }

        var opponent = board[squares[square]].player;

        board[squares[square]].player = null;
        board[squares[square]].availableMoves = [];
        board[squares[square]].occupied = false;

        totalScore = totalScore + score;
      };

      var player = (opponent === 1) ? 2 : 1;

      thisGame.players[player].score = thisGame.players[player].score + totalScore;
      thisGame._updateScore();
    },

    _updateScore: function() {
      var thisGame = this;

      console.log("\n\n\n\nScore:");
      console.log("Player1: " + thisGame.players[1].score + ". Player2: " + thisGame.players[2].score + "\n\n\n");
    },
    _opponent: function(player) {
      var opponent = (player === 1) ? 2 : 1;
      return opponent;
    },

    _clearEvaluatedMoves: function(board) {
      var clearFunc = function(square) {
        square.availableMoves = [];
      };
      this._evalSquareFunction(board, clearFunc);
    },

    _toggleBoard: function(state) {
      var self = this;
      if (state === "playing") { self._buildGameBoard() };
    },

    _buildGameBoard: function() {
      var self = this;
      var rows = 8;
      var cols = 8;
      var legal = false;
      var board = {};


      var gameBoard = new Board();

      self.$body.toggleClass('playing');            /* routes the screen to play mode */

      for (r=1; r<rows+1; r++) {

        self.$board.append('<div id="r' + r + '" class="row"></div>');

        for (c=1; c<cols+1; c++) {
          legal_space = legal ? "legal" : "illegal";
          square_name = "c" + c + "r" + r;

          gameBoard[square_name] = new Square(square_name);
          gameBoard[square_name].legal_space = legal_space;
          gameBoard[square_name].coords = {
            row: r,
            col: c
          };

          square = '<div id="' + square_name+'" class="square ' + legal_space + '"></div>'; /* MUST separate view from this */

          $('#r'+r).append(square);
          // $('#'+square_name).data( "coords", { row: r, col: c } );    /* deprecate ? */

          if ((c <= 3) && (legal)) {  // move to an initialize function
            if ( (c === 1) && (legal) ) {
              gameBoard[square_name].king2 = true;
            };
            gameBoard[square_name].player = 1;
            gameBoard[square_name].active = false;
            gameBoard[square_name].occupied = true;
            gameBoard[square_name].king = false;
            gameBoard[square_name]._populateSquare();
            gameBoard[square_name]._sane();
          } else if ((c >= 6) && (legal)) {
            if ( (c === 8) && (legal) ) {
              // like... new square (king) vs new square no king)
              gameBoard[square_name].king1 = true;
            };
            gameBoard[square_name].player = 2;
            gameBoard[square_name].occupied = true;
            gameBoard[square_name].king = false;
            gameBoard[square_name].active = false;
            gameBoard[square_name]._populateSquare();
            gameBoard[square_name]._sane();
          };
          legal = !legal;
        };
        legal = !legal;
      };

      self.turn = 1;
      self._playerTurn(gameBoard);

    },

    _toggleOccupiedSquare : function(square_name, player) {
      $('#'+square_name).toggleClass(player);
    },

    _toggleSelectedSquare : function($square) {
      $square.toggleClass('selected');
    },

    // send functions here to operate on individual squares
    _evalSquareFunction: function(board, callbackFunc) {
      var self = this,
          player = self.turn;

      for (var square in board) {

        if (board.hasOwnProperty(square)) {
          if ((square !== "currentSquare") && (board[square].legal_space === "legal")) {    // should be a boolean value
            if (board[square]._occupiedByPlayer(player)) {

              callbackFunc(board[square]);
            };
          };
        };
      };
    },

    _evaluatePlayerMoves: function(board) {
      var thisGame  = this,
          player    = thisGame.turn,
          evaluateMovesFunc = function(square) {
            square._evaluateMoves(board, player);
          };

      this._evalSquareFunction(board, evaluateMovesFunc);
    },

    _playerTurn : function(gameBoard) {
      var thisGame = this,
          $squares = $('.square');

      console.log("\nNew turn\nPlayer: " + thisGame.turn);

      thisGame._evaluatePlayerMoves(gameBoard);       // start the turn by populating available moves

      // if (player 1 !== 'cpu') { } // add this line here
      /* note - game has just STARTED -- it should say it is anticipating an action */

      $squares.on("click", function(evt) {
        var targetSquare = gameBoard[evt.currentTarget.id];
        console.log(targetSquare);

        if ( !targetSquare._active() ) {

          if ( (targetSquare._occupiedByPlayer(thisGame.turn)) && (targetSquare.availableMoves.length > 0) ){
            gameBoard._clearHighlights();
            gameBoard._highlightAvailableMoves(targetSquare);
          } else {                              // targetSquare is not active or clickable - clear
            gameBoard._clearHighlights();
          };
        };

        if (targetSquare._active()) {                     // target square is clickable - move
          gameBoard._initiateMove(targetSquare, thisGame);
          thisGame._clearEvaluatedMoves(gameBoard);
          gameBoard._clearHighlights();

          if (thisGame._proceed()) {
            thisGame.turn = (thisGame.turn === 1) ? 2 : 1;

            // new turn
            console.log("\nNew turn\nPlayer: " + thisGame.turn);
            thisGame._evaluatePlayerMoves(gameBoard);       // start the turn by populating available moves
          } else {
            thisGame._gameOver();
          };
        };

      });
    },

    _proceed: function() {
      var self = this;
      opponent = (self.turn === 1) ? 2 : 1;
      return true;
    },

    _gameOver: function() {
      var self = this;
      alert("Game over.  You win!");
    },

  }; /* end of Checkers.prototype */

  new Checkers();
});
