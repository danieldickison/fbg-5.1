/* global alert */
import Utils from './utils.js'
import { MULTI, MATCHUP } from './defaults.js'

export default class Run {
  constructor (game, input) {
    // Pointer to game object
    this.game = game
    this.input = input
    this.alert = 'subhead' // 'skip' or ''
    this.gameSetup = document.querySelector('.game-setup-container')
    this.scoreboardContainer = document.querySelector('.scoreboard-container')
    this.fieldContainer = document.querySelector('.field-container')
    this.boardContainer = document.querySelector('.board-container')
    this.plCard1 = document.querySelector('.board-container .pl-card1')
    this.plCard2 = document.querySelector('.board-container .pl-card2')
    this.multCard = document.querySelector('.board-container .mult-card')
    this.yardCard = document.querySelector('.board-container .yard-card')
    this.qualityContainer = document.querySelector('.board-container .quality-container')
    this.timesContainer = document.querySelector('.board-container .times-container')
    this.cardsContainer = document.querySelector('.cards-container')
    this.actualCards = this.cardsContainer.querySelector('.cards')
    this.promiseTracker = ''
    this.channel = null
  }

  moveBall () {
    const ball = document.querySelector('.field-container .ball')
    let left = parseInt(ball.style.left) || 10
    left += 100
    if (left > 500) left = 10
    ball.style.left = `${left}px`
  }

  sleep (ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  async alertBox (msg) {
    msg = this.printTime(this.game.current_time) + ' | ' + msg
    if (this.alert === 'alert') {
      alert(msg)
    } else if (this.alert === 'subhead') {
      const el = document.createElement('p')
      const t = document.createTextNode(msg)
      el.appendChild(t)
      document.querySelector('.field-container .modal-message').prepend(el)
      await this.sleep(750)
    } else {
      console.log(msg)
    }

    return new Promise(resolve => {
      // setTimeout(resolve(), ms)
      resolve()
    })
  };

  // prepareHTML () {
  //   document.querySelector('.selection.pl1').innerHTML = ''
  //   document.querySelector('.selection.pl2').innerHTML = ''
  //   document.querySelector('.page-main h1').innerText = 'Player 1 Pick Play'
  //   document.querySelector('.page-main .to-butt1').innerHTML = 'Timeout? (<span>' + this.game.players[1].timeouts + '</span>)'
  //   document.querySelector('.page-main .to-butt1').classList.remove('hidden')
  //   document.querySelector('.page-sidebar .to-butt2').innerText = 'TO'
  //   document.querySelector('.page-sidebar h1').innerText = 'Player 2 Pick Play'
  //   this.showBoard(document.querySelector('.scoreboard-container'))
  //   document.querySelector('.main-container').classList.add('game') // LATER: When completely done with game, remove this
  //   document.querySelector('.scoreboard-container').classList.remove('hidden')
  //   document.querySelector('.page-subheader').classList.remove('hidden')
  // }

  setBallSpot (newSpot = this.game.spot) {
    // Basically need to calculate the time based on the last play and async await animation based on that
    // Longer plays will move quickly, shorter plays slower
    // Maybe add a little inflation of ball as it moves - but that can be later, focus on function
    // document.documentElement.style.setProperty('--ball-speed', this.game.spot - this.game.lastSpot)
    document.documentElement.style.setProperty('--ball-spot', (document.querySelector('.field').offsetHeight / 100 * ((100 - newSpot) + 44)) + 'px')
    // const ballSpot = document.documentElement.style.getPropertyValue('--ball-spot')
    // console.log(ballSpot)
    // console.log(document.querySelector('.field').offsetHeight)
    // console.log((144 + (100 - this.game.spot)))
    // console.log(document.querySelector('.field').offsetHeight / 100 * ((100 - this.game.spot) + 44))
  }

  setSpot (newSpot) {
    this.game.lastSpot = this.game.spot
    this.game.spot = newSpot
  }

  animationSimple (el, cls) {
    el.classList.toggle(cls)
  }

  async animationWaitAndHide (el, cls) {
    el.addEventListener('transitionend', () => {
      el.style.display = 'none'
    }, { once: true })
    this.animationSimple(el, cls)
  }

  animmationWaitAndAdd (el, cls) {
    el.style.display = ''
    this.animationSimple(el, cls)
  }

  async animationWaitForCompletion (el, cls) {
    return new Promise(resolve => {
      el.addEventListener('transitionend', () => {
        resolve()
      }, { once: true })
      this.animationSimple(el, cls)
    })
  }

  async animationWaitThenHide (el, cls) {
    await this.animationWaitForCompletion(el, cls)
    el.style.display = 'none'
  }

  async prepareHTML () {
    this.setSpot(65)
    this.setBallSpot()
    // // await this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
    this.animationSimple(this.cardsContainer, 'slide-down')
    await this.animationWaitForCompletion(this.scoreboardContainer, 'slide-up')
    // // this.animationSimple(this.boardContainer, 'slide-away')
    // await this.animationWaitForCompletion(this.fieldContainer, 'slide-away')
    this.actualCards.innerText = ''

    // // Hide game-setup board
    // const gameSetup = document.querySelector('.game-setup-container')
    // gameSetup.addEventListener('transitionend', () => {
    //   gameSetup.style.display = 'none'
    // }, { once: true })
    // if (gameSetup.classList.contains('slide-away')) {
    //   gameSetup.classList.remove('slide-away')
    // //   gameSetup.style.display = 'block'
    // } else {
    //   gameSetup.classList.add('slide-away')
    // //   gameSetup.style.display = 'none'
    // }

    await this.animationWaitThenHide(this.gameSetup, 'slide-away')

    // await this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
    // await this.animationWaitForCompletion(this.scoreboardContainer, 'slide-away')
    // await this.animationWaitForCompletion(this.boardContainer, 'slide-away')
    // await this.animationWaitForCompletion(this.fieldContainer, 'slide-away')

    // await this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
  }

  async playGame (channel) {
    this.channel = channel

    await this.prepareHTML()

    await this.gameLoop(this.game, 0)

    console.log(this.game)
  };

  async gameLoop (game, test = 11) {
    // Pass status into gameLoop for testing purposes
    game.status = test
    // gameStart, so set time to 0.5
    if (test === 0) {
      game.current_time = -0.5 // LATER: Remember to check
    }

    // This is the game loop
    while (game.status < 900) {
      if (game.status < 900) {
        await this.gameControl(game)
      }
      while (game.current_time >= 0 && game.status !== 999) {
        // game.save('as-' + datetime.now().strftime("%m.%d.%Y-%H.%M.%S"))
        if (game.status < 0) {
          await this.kickoff(game)
        } else if ((game.status > 10 && game.status < 100) || game.two_point) {
          await this.playMechanism(game)
        }

        if (game.status !== 999) {
          await this.endPlay(game)
        }
      }
    }

    if (game.status === 999) {
      game.status = 0
    }
  };

  async kickoff (game) {
    const oNum = game.off_num
    const dNum = game.def_num
    game.down = 0
    game.fst_down = 0

    await this.prePlay(game, game.status) // NOW: Check on this

    if (game.status === -4) {
      await this.punt(game, oNum, -4) // Safety Kick
      // Regular old kickoff
    } else {
      // Reset board
      game.spot = 65
      game.thisPlay.dist = 0
      // moveBall('s');

      await this.kickPage(game, oNum)

      if (game.status !== 999) {
        await this.returnPage(game, dNum)
      }
      if (game.status !== 999) {
        await this.kickDec(game)
      }
      if (game.status < 0) {
        game.status = Math.abs(game.status) // Make status positive (no more kicking)
      }
    }
  };

  async changePoss (game, mode = '') {
    // Modes explained
    // '' = just change poss
    // 'k' = kick (like a kickoff)
    // 'nop' = no ot poss, just change (but in OT)
    // 'ot' = set up OT
    // 'to' = turnover
    // 'pnt' = punt
    // 'fg' = missed field goal

    if (mode !== '' && mode !== 'k' && mode !== 'nop') {
      // moveBall('c');  // Which cleared the ball
    }

    if (mode !== 'nop' && mode !== 'ot' && game.isOT() && !game.two_point && game.ot_poss > 0) {
      game.ot_poss = -game.ot_poss // This indicates that the ot poss just ended, handle appropriately
    }

    if (mode === 'to') {
      game.spot = 100 - game.spot // Switch side of field
      // addRecap(game, teamName + ' turnover!') // or however
      // game.players[game.off_num].stats.tos++;  // Inc turnovers in Stats
      game.turnover = true
      game.down = 0
    } else if (mode === 'ot') {
      // Probably need a visual reset here
      game.spot = 75
      game.ot_poss = Math.abs(game.ot_poss) - 1
    } else if (mode === 'pnt') {
      game.spot = 100 - game.spot // Switch side of field
      game.down = 0
    } else if (mode === 'fg') {
      if (!game.isOT()) {
        if ((100 - game.spot) + 7 <= 20) { // By an obscure NFL rule, essentially a touchback
          game.spot = 20
        } else { // Take over at spot of kick
          game.spot = 100 - game.spot + 7
        }
        game.down = 0
      }
    } else if (mode === 'nop') {
      game.down = 0
    }

    if (mode !== '' && mode !== 'k' && mode !== 'nop') {
      // moveBall('s');  // Which showed ball
    }

    // This should never happen, but it's making sure the possessions don't equal each other
    // We assume to offensive number is correct
    if (game.off_num === game.def_num) {
      game.def_num = game.opp(game.off_num)
    }

    // Actually change possession
    const tmp = game.off_num
    game.off_num = game.def_num
    game.def_num = tmp
    // printNeedle(game.off_num);

    if (game.status >= 11 && game.status <= 17 && game.status !== 16) {
      if (mode !== 'ot') {
        // printFirst(game);  // These are the first down markers
      }
      game.fst_down = game.spot + 10 // CHECK: I think this is needed
      await this.updateDown(game)
    }
  };

  async kickPage (game, oNum) {
    const oName = game.players[oNum].team.name
    // printDown('KICK');
    // let kckDec = null;
    while (game.players[oNum].currentPlay === '' && game.status !== 999) {
      if (game.isReal(oNum)) {
        await this.alertBox(oName + ' pick kickoff type...')
        if (this.cardsContainer.classList.contains('slide-down')) {
          this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
        }
        await this.playPages(game, oNum, 'kick')
      } else {
        await this.cpuPages(game, 'kick')
      }

      if (game.players[oNum].currentPlay === 'TO') {
        await this.timeout(game, oNum)
      }
    }
    if (game.isReal(oNum) && !this.cardsContainer.classList.contains('slide-down')) {
      this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
    }
  }

  async playPickedAnimation (game) {
    // this.animationWaitForCompletion(this.boardContainer, 'slide-away')
    // await this.animationWaitForCompletion(this.fieldContainer, 'slide-away')
    // await this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
    // this.animationWaitForCompletion(this.fieldContainer, 'slide-away')
    // this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
    document.querySelector('.pl-card2').innerText = game.players[2].currentPlay
    document.querySelector('.pl-card2').classList.add('picked')
  }

  async returnPage (game, dNum, pick = null) {
    const dName = game.players[dNum].team.name
    while (game.players[dNum].currentPlay === '' && game.status !== 999) {
      if (game.isReal(dNum)) {
        await this.alertBox(dName + ' pick return type...')
        if (this.cardsContainer.classList.contains('slide-down')) {
          this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
        }
        await this.playPages(game, dNum, 'ret', pick)
      } else {
        await this.cpuPages(game, 'ret', pick)
      }

      if (game.players[dNum].currentPlay === 'TO') {
        await this.timeout(game, dNum)
      }
    }
    if (game.isReal(dNum) && !this.cardsContainer.classList.contains('slide-down')) {
      this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
    }
  }

  // const aliceTumbling = [
  //   { transform: 'rotate(0) scale(1)' },
  //   { transform: 'rotate(360deg) scale(0)' }
  // ];

  // const aliceTiming = {
  //   duration: 2000,
  //   iterations: 1,
  //   fill: 'forwards'
  // }

  // const alice1 = document.querySelector("#alice1");
  // const alice2 = document.querySelector("#alice2");
  // const alice3 = document.querySelector("#alice3");

  // const sequence = async () => {
  //   await alice1.animate(aliceTumbling, aliceTiming).finished
  //   await alice2.animate(aliceTumbling, aliceTiming).finished
  //   await alice3.animate(aliceTumbling, aliceTiming).finished
  // }

  // sequence()

  async showPlayResults (game) {
    const boardIn = [
      { transform: '...' },
      { transofrm: '...' }
    ]

    const el = document.querySelector('.board-container')

    const sequence = async () => {
      await el.animate(boardIn).finished
    }

    sequence()
  }

  async kickDec (game, die1 = null, mCoddsdie2 = null, yC = null) {
    const oName = game.players[game.off_num].team.name
    const dName = game.players[game.def_num].team.name
    const kickType = game.players[game.off_num].currentPlay
    const retType = game.players[game.def_num].currentPlay
    let touchback = false
    let possession = true
    let tmp = null
    let kickDist = 0
    let mltCard = ''
    let yard = 0
    let multiplier = 0 // Recently changed from -1
    let retDist = 0
    let okResult = false
    const elPlCard2 = document.querySelector('.pl-card2')
    const elMultCard = document.querySelector('.mult-card')
    const elYardCard = document.querySelector('.yard-card')
    const elTimesCont = document.querySelector('.times-container')

    await this.alertBox('Teams are lining up for the kick...')

    // await this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
    // await this.animationWaitForCompletion(this.fieldContainer, 'slide-away')

    // this.animationSimple(this.fieldContainer, 'slide-away')
    // await this.animationWaitForCompletion(this.cardsContainer, 'slide-down')

    elPlCard2.innerText = retType
    await this.animationWaitForCompletion(elPlCard2, 'picked')

    if (kickType === 'RK') {
      if (retType === 'RR') {
        tmp = Utils.rollDie()
        if (die1) {
          tmp = die1
        }
        kickDist = 5 * tmp - 65
        mltCard = game.decMults().card
        if (mCoddsdie2) {
          mltCard = mCoddsdie2
        }
        yard = game.decYards()
        if (yC) {
          yard = yC
        }

        if (mltCard === 'King') {
          multiplier = 10
        } else if (mltCard === 'Queen') {
          multiplier = 5
        } else if (mltCard === 'Jack') {
          multiplier = 1 // Recently changed from 0
        }

        elMultCard.innerText = mltCard
        await this.animationWaitForCompletion(elMultCard, 'picked')
        elYardCard.innerText = yard
        await this.animationWaitForCompletion(elYardCard, 'picked')
        elTimesCont.innerText = multiplier + 'x'
        await this.animationWaitForCompletion(elTimesCont, 'picked')

        retDist = multiplier * yard
        // Touchback
      } else {
        touchback = true
      }
    } else if (kickType === 'OK') {
      await this.alertBox(oName + ' onside kick!!!')
      let odds = 6
      if (retType === 'RK') {
        odds = 12
      }

      tmp = Utils.randInt(1, odds)
      if (mCoddsdie2) {
        tmp = mCoddsdie2
      }
      okResult = tmp === 1 // 1 in 'odds' odds of getting OK
      kickDist = -10 - tmp
      retDist = tmp + Utils.rollDie()
      if (die1) {
        retDist = tmp + die1
      }
      // Squib Kick
    } else {
      tmp = Utils.rollDie()
      if (die1) {
        tmp = die1
      }
      kickDist = -15 - 5 * tmp
      if (retType === 'RR') {
        tmp = Utils.rollDie() + Utils.rollDie()
        if (die1 && mCoddsdie2) {
          tmp = die1 + mCoddsdie2
        }
        retDist = tmp
      } else {
        retDist = 0
      }
    }

    await this.alertBox('The kick is up...')

    if (touchback) {
      await this.alertBox('Deep kick!')
      // moveBall('c');
    } else {
      await this.alertBox(oName + ' kick...')
      game.thisPlay.dist = kickDist
      // moveBall('k');
      game.spot += kickDist
    }

    if (kickType === 'OK') {
      if (okResult) {
        await this.alertBox(oName + ' recover!')
        possession = false
        retDist = -retDist
      } else {
        await this.alertBox(dName + ' recover!')
      }
    }

    if (possession) {
      await this.changePoss(game, 'k')
    }

    let msg = 'The return...\n'
    if (!touchback) {
      if (retDist === 0) {
        msg += 'No return\n'
      } else {
        tmp = game.spot // Nec?

        if (possession) {
          msg += dName + ' return...\n'
        } else {
          msg += oName + ' return...\n'
        }

        if (game.spot + retDist >= 100) {
          game.status = 101
          // addRecap( kick return TD )
          retDist = 100 - game.spot
        } else if (game.spot + retDist <= 0) {
          game.status = 102
          retDist = -game.spot
        }

        game.thisPlay.dist = retDist
        // moveBall('k');
        game.spot += retDist
        msg += (retDist > 0 ? '+' : '-') + Math.abs(retDist) + '-yard return!'
      }
    } else {
      msg += 'Touchback...'
      game.spot = 25
      // moveBall('s');
      // Return Timeout
      if (game.time_change === 4) {
        this.returnTime(game.last_call_to)
      }
      if (game.two_min) {
        game.two_min = false
      }
      // LATER: Change to 'tb' or something better
      game.time_change = 1
    }
    await this.alertBox(msg)

    // if (game.status < 0) {
    //   game.status = Math.abs(game.status) // Make status positive (no more kicking)
    // }
  };

  async playMechanism (game) {
    await this.prePlay(game, 11)
    await this.pickPlay(game)

    // console.log(stat);
    if (game.status !== 999) {
      await this.lastChanceTO(game)
      await this.doPlay(game, game.players[1].currentPlay, game.players[2].currentPlay)
    }
  };

  async lastChanceTO (game) {
    let selection

    // Very end of the game
    if (game.status < 900 && ((game.qtr === 2 || game.qtr === 4) && game.current_time === 0) && !game.time_change) {
      for (let p = 1; p <= 2; p++) {
        // Real and have a timeout, one's not been called
        if (game.isReal(p) && game.players[p].timeouts && !game.time_change) {
          console.log('p: ' + p + ' time_change: ' + game.time_change)
          alert('The ' + (game.qtr === 2 ? 'half' : 'game') + ' is about to end!\nWould the ' + game.players[p].team.name + ' like to call a timeout?')

          if (this.cardsContainer.classList.contains('slide-down')) {
            this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
          }

          selection = await this.input.getInput(game, p, 'last')

          if (selection === 'Y') {
            await this.timeout(game, p)
          }
        }
        if (game.isReal(p) && !this.cardsContainer.classList.contains('slide-down')) {
          this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
        }
        if (game.isReal(p) && !this.fieldContainer.classList.contains('slide-away')) {
          this.animationWaitForCompletion(this.fieldContainer, 'slide-away')
        }
      }
    }
  };

  async prePlay (game, stat) {
    // console.log(game) // LATER: Suppress this ASAP
    // console.log('prePlay');
    game.thisPlay.multiplier_card = 999
    game.thisPlay.multiplier_num = 999
    game.thisPlay.yard_card = 999
    game.thisPlay.multiplier = 999
    game.thisPlay.dist = 999
    game.thisPlay.bonus = 0
    game.players[1].currentPlay = ''
    game.players[2].currentPlay = ''

    // Make sure board is showing
    await this.slideBoard()

    this.plCard1.innerText = ''
    this.plCard2.innerText = ''
    this.multCard.innerText = ''
    this.yardCard.innerText = ''
    this.qualityContainer.innerText = ''
    this.timesContainer.innerText = ''

    this.fieldContainer.classList.remove('slide-away')

    this.plCard1.classList.remove('picked')
    this.plCard2.classList.remove('picked')
    this.multCard.classList.remove('picked')
    this.yardCard.classList.remove('picked')
    this.qualityContainer.classList.remove('picked')
    this.timesContainer.classList.remove('picked')

    if (this.cardsContainer.classList.contains('slide-down')) {
      await this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
    }

    if (!game.two_point || game.time_change !== 4) {
      game.time_change = 0
    }

    if (game.turnover && game.down !== 1) {
      game.down = 1
    }

    game.turnover = false

    game.status = stat

    if ((game.qtr === 2 || game.qtr === 4) && game.current_time === 2) {
      await this.twoMinCheck(game)
    }
  };

  async twoMinCheck (game) {
    let twoMin = game.two_minute
    let timChg

    // Two-minute warning just ended
    if (twoMin) {
      timChg = 0
      twoMin = false

      // Two-minute warning needs to start
    } else {
      timChg = 9
      twoMin = true
      await this.alertBox('Two-minute warning...')
    }

    game.time_change = timChg
    game.two_minute = twoMin
  };

  async pickPlay (game) {
    // console.log('pickPlay');
    for (let p = 1; p <= 2; p++) {
      game.players[p].currentPlay = ''

      // Computer Stuff
      if (game.status !== 999 && p === 2 && !game.isReal(2)) {
        // This is where the computer can call timeout or pick special play
        await this.alertBox(game.players[2].team.name + ' are picking their play...')
        document.querySelector('.' + (game.away === game.off_num ? 'away-msg' : 'home-msg') + '.top-msg').innerText = game.players[2].team.name + ' are picking their play...'
        // await this.slideBoard()
        if (game.time_change === 0) {
          await this.cpuTime(game)
        }

        this.cpuPlay(game)
      }

      while (game.players[p].currentPlay === '' && game.status !== 999) {
        if (game.isReal(p)) {
          await this.playPages(game, p)
        } else {
          await this.cpuPages(game)
        }

        if (game.players[p].currentPlay === 'TO') {
          await this.timeout(game, p)
        }
      }
      if (game.isReal(p) && !this.cardsContainer.classList.contains('slide-down')) {
        this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
      }
      if (game.isReal(p) && !this.fieldContainer.classList.contains('slide-away')) {
        this.animationWaitForCompletion(this.fieldContainer, 'slide-away')
      }
      // this.boardAnimate('in')
      // await this.slideBoard('collapse')
      // this.animationSimple(this.cardsContainer, 'slide-down')
      // this.animationSimple(this.fieldContainer, 'slide-away')
    }

    // Making sure you didn't exit
    if (game.status !== 999) {
      game.status = this.setStatus(game, game.players[1].currentPlay, game.players[2].currentPlay)
      // debugger

      await this.alertBox('Both teams are lining up for the snap...')

      // Exit out of the game
    } else {
      await this.alertBox('Catch ya laterrrrr!')
      // console.log(game);
    }
  };

  boardAnimate (option) {
    const board = document.querySelector('.board-container')
    board.addEventListener('transitionend', () => {
      if (option === 'in') {
        board.style.display = ''
      } else {
        board.style.display = 'none'
      }
    }, { once: true })
    if (board.classList.contains('slide-away')) {
      board.classList.remove('slide-away')
    } else {
      board.classList.add('slide-away')
    }
  }

  async slideBoard (option = 'uncollapse', el = document.querySelector('.scoreboard-container')) {
    // return new Promise(resolve => {
    //   const onTransitionEnd = () => {
    //     el.removeEventListener('transitionend', onTransitionEnd)
    //     resolve()
    //   }
    //   el.addEventListener('transitionend', onTransitionEnd)

    //   if (option === 'uncollapse') {
    //     if (el.classList.contains('collapsed')) {
    //       el.classList.remove('collapsed')
    //       // resolve()
    //     } else {
    //       resolve()
    //     }
    //   } else {
    //     el.classList.add('collapsed')
    //     // resolve()
    //   }
    // })

    await this.animationWaitForCompletion(el, 'collapsed')
  }

  async cpuTime (game) {
    const toCount = game.players[2].timeouts
    const ono = game.off_num

    if (toCount > 0) {
      const qtr = game.qtr
      const ctim = game.current_time
      const spt = game.spot
      const p1s = game.players[1].score
      const p2s = game.players[2].score
      let endHalf = false
      let lastMin = false
      let ballBack = false
      let kick = false

      // End half and losing
      endHalf = ((ono === 2 && (qtr === 2 || qtr === 4)) && p2s <= p1s && ctim <= 1 && game.down !== 4)

      // Last minute with fav||able spot
      if (!endHalf) {
        lastMin = (((ono === 1 && spt < 50) || (ono === 2 && spt >= 50)) && qtr === 2 && ctim <= 1)
      }
      // Chance to get the ball back
      if (!endHalf && !lastMin) {
        ballBack = ((qtr === 2 || qtr === 4) && ctim === 0 && ono === 1 && game.players[1].timeouts === 0 && game.down === 4)
      }
      // Timeout on kickoff
      if (!endHalf && !lastMin && !ballBack) {
        kick = (qtr === 4 && ctim <= 0.5 && game.status === -3 && p2s < p1s)
      }
      if (endHalf || lastMin || ballBack || kick) {
        await this.timeout(game, 2)
        // print_timeout()
      }
    }
  };

  async timeout (game, p) {
    const tChg = game.time_change
    const toCount = game.players[p].timeouts
    let msg = ''

    // 9 = Two-min call
    if (tChg === 9) {
      msg = 'Timeout not called, two minute warning...'
    } else if (game.two_point) {
      msg = 'Timeout not called, two-point conversion...'
      // 4 = Timeout called
    } else if (tChg !== 4) {
      // Call timeout
      if (toCount > 0) {
        const to = game.callTime(p)
        game.last_call_to = p
        game.time_change = 4
        msg = 'Timeout called by ' + game.players[p].team.name
        document.querySelector('.' + (game.away === p ? 'away' : 'home') + ' .to' + to).classList.add('called')
        // Disable button mid-play
        // this.input.disableTimeout(p);
        // LATER: Print timeout change
        // No timeouts left
      } else {
        msg = 'Timeout not called, no timeouts...'
      }
    } else {
      msg = "Timeout not called, one's been called..."
    }

    await this.alertBox(msg)
    game.players[p].currentPlay = ''
  };

  cpuPlay (game) {
    if (game.off_num === 2) {
      const qtr = game.qtr
      const curtim = game.current_time
      const toCount = game.players[2].timeouts
      const tchg = game.time_change
      const qlen = game.qtr_length
      const spt = game.spot
      const hm = game.players[2].hm
      const dwn = game.down
      const fdn = game.fst_down
      const diff = game.players[1].score - game.players[2].score
      let scoreBlock = 0
      let timeBlock = 0
      let dec = null

      // Time block
      if (curtim === 0 && (qtr === 2 || qtr === 4) && toCount === 0 && tchg !== 4) {
        timeBlock = 1 // Last play
      } else if (curtim <= 0.5 && qtr === 4) {
        timeBlock = 2 // Late game
      } else if ((qlen <= 2 && (qtr >= 3 && qtr <= 4)) || (curtim <= 4 && qtr === 4)) {
        timeBlock = 3 // Some left
      } else if ((qlen <= 4 && (qtr >= 3 && qtr <= 4)) || (curtim <= 8 && qtr === 4)) {
        timeBlock = 4 // Lots left
      }

      // Score Block
      if (diff >= 1) {
        if (diff <= 3) {
          scoreBlock = 1 // Down a FG
        } else if (diff <= 8) {
          scoreBlock = 2 // Down a possession
        } else if (diff <= 11) {
          scoreBlock = 3 // Down a poss + FG
        } else {
          scoreBlock = 4 // Down 2+ TDs
        }
      }

      // Put it all together
      // Half over, kick a FG
      if (spt >= 60 && ((timeBlock === 1 && qtr === 2) || (scoreBlock === 0 && timeBlock === 1 && qtr === 4))) {
        dec = 'FG'
      }

      // Hail mary
      if (!dec && hm && ((timeBlock === 1 && scoreBlock > 1) || (timeBlock === 2 && scoreBlock === 1 && spt < 70) || (timeBlock === 2 && scoreBlock > 1))) {
        dec = 'HM'
      }

      // Gotta go for it
      if (!dec && timeBlock === 1 && scoreBlock === 1) {
        if (spt >= 60) {
          dec = 'FG' // To win or tie
        } else if (hm) {
          dec = 'HM'
        }
      }

      // OT go for it
      if (!dec && qtr > 4 && scoreBlock === 2 && dwn === 4) {
        if (hm && fdn - spt > 10) {
          dec = 'HM'
        } else {
          dec = 'GO' // Cuz there are no punts
        }
      }

      // 4th down, dire
      if (!dec && dwn === 4 && (((timeBlock >= 1 && timeBlock <= 2) && scoreBlock === 1) || (timeBlock >= 3 && scoreBlock === 3))) {
        if (spt >= 60) {
          dec = 'FG'
        } else {
          if (hm && fdn - spt > 10) {
            dec = 'HM'
          } else {
            dec = 'GO'
          }
        }
      }

      // 4th down, go
      if (!dec && dwn === 4 && ((timeBlock === 3 && (scoreBlock >= 1 && scoreBlock <= 4)) || (timeBlock === 4 && scoreBlock === 4))) {
        if (hm && fdn - spt > 10) {
          dec = 'HM'
        } else {
          dec = 'GO'
        }
      }

      // 4th down, regular choices
      if (!dec && dwn === 4) {
        if (Utils.coinFlip() && (spt >= 98 || (spt >= 50 && spt <= 70)) && fdn - spt <= 3) {
          dec = 'GO'
        }

        // Not going for it, so...
        if (!dec) {
          if (spt >= 60) {
            dec = 'FG'
          } else {
            dec = 'PT'
          }
        }
      }

      // Set the play
      if (!(!dec || dec === 'GO' || game.two_point)) {
        game.players[2].currentPlay = dec
      }
    }
  };

  async cpuPages (game, state = 'reg', pick = null) {
    if (state === 'reg') {
      let total = 0
      let playNum = -1
      let playAbrv = ''

      while (total === 0) {
        playNum = Utils.randInt(0, 4)

        // Make it harder to pick Trick Play
        if (playNum === 4) {
          playNum = Utils.randInt(0, 4)
        }

        // Translate to abrv
        playAbrv = 'SRLRSPLPTP'.substring(2 * playNum, 2 * playNum + 2)
        total = game.players[2].plays[playAbrv].count
      }

      game.players[2].currentPlay = playAbrv
    } else if (state === 'xp') {
      await this.alertBox(game.players[2].team.name + ' selecting PAT type...\n')
      let selection = 'XP'

      const diff = game.players[1].score - game.players[2].score

      if (diff === -5 || diff === -1 || diff === 2 || diff === 5 || diff === 9 || diff === 10 || diff === 13 || diff === 17 || diff === 18) {
        selection = '2P'
      }

      game.players[2].currentPlay = selection
    } else if (state === 'kick') {
      await this.alertBox(game.players[2].team.name + ' selecting kickoff type...')
      await this.cpuTime(game)

      const qtr = game.qtr
      const ctim = game.current_time
      const p2s = game.players[2].score
      const p1s = game.players[1].score
      let kckDec = 'RK'

      if ((qtr === 4 && ctim <= 3 && p2s < p1s) || (((qtr === 3 && ctim <= 7) || qtr === 4) && p1s - p2s > 8)) {
        kckDec = 'OK'
      } else if ((qtr === 2 || qtr === 4) && ctim <= 1 && p2s > p1s) {
        kckDec = 'SK'
      }

      game.players[2].currentPlay = kckDec
    } else if (state === 'ret') {
      this.alertBox(game.players[2].team.name + ' selecting return type...')
      await this.cpuTime(game)

      const qtr = game.qtr
      const ctim = game.current_time
      const p2s = game.players[2].score
      const p1s = game.players[1].score
      let retDec = 'RR'

      // Very late game and P1 losing -OR- later game and P1 losing badly
      if ((qtr === 4 && ctim <= 3 && p1s < p2s) || (((qtr === 3 && ctim <= 7) || qtr === 4) && p2s - p1s > 8)) {
        retDec = 'OR'
      } else if (Utils.coinFlip()) {
        retDec = 'TB'
      }

      game.players[2].currentPlay = retDec
    }

    if (pick) {
      game.players[2].currentPlay = pick
    }
  };

  async playPages (game, p, state = 'reg', pick = null) {
    let selection = null

    // await this.slideBoard()
    if (this.cardsContainer.classList.contains('slide-down')) {
      await this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
    }
    selection = await this.input.getInput(game, p, state)

    // LATER: Send user selection to server
    // this.channel.trigger('client-picked-play', { selection })

    game.players[p].currentPlay = selection
  };

  // Determine if passed play is valid for this play
  playLegal (p, passedType, abrv, thisType) {
    let legal = false
    if (passedType !== 'reg' && passedType === thisType) {
      legal = true
    } else if (passedType === 'reg' && thisType === 'reg') {
      const playIndex = 'SR,LR,SP,LP,TP,HM,FG,PT'.indexOf(abrv) / 3
      let totalPlays = 0
      legal = true // Assume that the pick is valid

      // Get total plays left
      if (abrv === 'FG' || abrv === 'PT') {
        totalPlays = -1
      } else if (abrv === 'HM') {
        totalPlays = this.game.players[p].hm
      } else if (playIndex !== -1) {
        totalPlays = this.game.players[p].plays[abrv].count
      }

      // Out of plays
      if (playIndex >= 0 && playIndex <= 5) {
        if (totalPlays === 0) {
          legal = false
        }
      }

      // Illegal play choice
      if (legal && playIndex === -1) {
        legal = false
      }

      // HM or kick on defense
      if (legal && playIndex >= 5 && playIndex <= 7 && this.game.def_num === p) {
        legal = false
      }

      // Super long FG
      if (legal && abrv === 'FG' && this.game.spot < 30) {
        legal = false
      }

      // Punt on not fourth
      if (legal && abrv === 'PT' && this.game.down !== 4) {
        legal = false
      }

      // Punt in OT
      if (legal && abrv === 'PT' && this.game.isOT()) {
        legal = false
      }

      // Kick on two-point conversion
      if (legal && totalPlays === -1 && this.game.two_point) {
        legal = false
      }
    }

    return legal
  }

  topMessageDown (aTop, hTop) {
    if (aTop.classList.contains('top-up')) {
      aTop.classList.remove('top-up')
    }
    if (hTop.classList.contains('top-up')) {
      hTop.classList.remove('top-up')
    }
    aTop.classList.add('top-down')
    hTop.classList.add('top-down')
  }

  topMessageUp (aTop, hTop) {
    if (aTop.classList.contains('top-down')) {
      aTop.classList.remove('top-down')
    }
    if (hTop.classList.contains('top-down')) {
      hTop.classList.remove('top-down')
    }
    aTop.classList.add('top-up')
    hTop.classList.add('top-up')
  }

  showBoard (board) {
    // Cache pieces
    const blMsg = document.querySelector('.away-msg.bot-msg')
    const brMsg = document.querySelector('.home-msg.bot-msg')
    const awayTeam = document.querySelector('.away.team')
    const homeTeam = document.querySelector('.home.team')
    const awayScore = document.querySelector('.away.score')
    const homeScore = document.querySelector('.home.score')
    const clockTime = document.querySelector('.clock .time')
    const clockQtr = document.querySelector('.clock .qtr')

    // Animate board up and down
    // const topMessageDown = (aTop, hTop) => {
    //   if (aTop.classList.contains('top-up')) {
    //     aTop.classList.remove('top-up')
    //   }
    //   if (hTop.classList.contains('top-up')) {
    //     hTop.classList.remove('top-up')
    //   }
    //   aTop.classList.add('top-down')
    //   hTop.classList.add('top-down')
    // }

    // const topMessageUp = (aTop, hTop) => {
    //   if (aTop.classList.contains('top-down')) {
    //     aTop.classList.remove('top-down')
    //   }
    //   if (hTop.classList.contains('top-down')) {
    //     hTop.classList.remove('top-down')
    //   }
    //   aTop.classList.add('top-up')
    //   hTop.classList.add('top-up')
    // }

    // const bottomMessageDown = (aBot, hBot) => {
    //   if (aBot.classList.contains('bot-up')) {
    //     aBot.classList.remove('bot-up')
    //   }
    //   if (hBot.classList.contains('bot-up')) {
    //     hBot.classList.remove('bot-up')
    //   }
    //   aBot.classList.add('bot-down')
    //   hBot.classList.add('bot-down')
    // }

    // const bottomMessageUp = (aBot, hBot) => {
    //   if (aBot.classList.contains('bot-down')) {
    //     aBot.classList.remove('bot-down')
    //   }
    //   if (hBot.classList.contains('bot-down')) {
    //     hBot.classList.remove('bot-down')
    //   }
    //   aBot.classList.add('bot-up')
    //   hBot.classList.add('bot-up')
    // }

    // Possession
    if (this.game.away === this.game.off_num) {
      if (homeTeam.classList.contains('poss')) {
        homeTeam.classList.remove('poss')
      }
      awayTeam.classList.add('poss')
    } else {
      if (awayTeam.classList.contains('poss')) {
        awayTeam.classList.remove('poss')
      }
      homeTeam.classList.add('poss')
    }

    // if (this.game.home === this.game.off_num) {
    //   board.querySelector('.topRight').innerText = '🏈'
    // } else {
    //   board.querySelector('.topRight').innerHTML = '&nbsp;'
    // }

    // Name (This should really only be done once)
    homeTeam.innerText = this.game.players[this.game.home].team.abrv
    awayTeam.innerText = this.game.players[this.game.away].team.abrv

    // Score
    homeScore.innerText = this.game.players[this.game.home].score
    awayScore.innerText = this.game.players[this.game.away].score

    // Time
    clockTime.innerText = this.printTime(this.game.current_time)

    // topMessageDown(awayMsg, homeMsg)
    // bottomMessageUp(blMsg, brMsg)

    // First Down
    if (this.game.away === this.game.off_num) {
      blMsg.innerText = this.game.down + this.ending(this.game.down) + ' & ' + this.downDist(this.game.fst_down, this.game.spot)
    } else {
      brMsg.innerText = this.game.down + this.ending(this.game.down) + ' & ' + this.downDist(this.game.fst_down, this.game.spot)
    }

    // Ball Spot
    if (this.game.away === this.game.off_num) {
      brMsg.innerText = this.printSpot(this.game, this.game.spot)
    } else {
      blMsg.innerText = this.printSpot(this.game, this.game.spot)
    }

    // topMessageUp(awayMsg, homeMsg)
    // bottomMessageDown(blMsg, brMsg)

    // Qtr
    clockQtr.innerText = this.showQuarter(this.game.qtr)
  }

  showQuarter (qtr) {
    if (qtr > 4) {
      qtr = qtr - 4

      if (qtr === 1) {
        qtr = 'OT'
      } else {
        qtr = qtr + 'OT'
      }
    } else {
      qtr = qtr + this.ending(qtr)
    }

    return qtr
  }

  ending (num) {
    let ending = 'th'

    if (num === 1) {
      ending = 'st'
    } else if (num === 2) {
      ending = 'nd'
    } else if (num === 3) {
      ending = 'rd'
    }

    return ending
  };

  downDist (f, s) {
    let ending = f - s

    if (f === 100) {
      ending = 'G'
    } else if (f === s) {
      ending = 'IN'
    }

    return ending
  };

  printTime (time) {
    if (time === -0.5) {
      return 'End'
    } else {
      const min = Math.trunc(time)
      const sec = (time - min === 0.5) ? '30' : '00'
      // HW: How would you do other times?

      return min + ':' + sec
    }
  };

  printSpot (game, s) {
    let spot = '50'
    // console.log(game.off_num);
    // console.log(game.players[1].team.abrv);
    // console.log(game.players[game.off_num].team.abrv);
    if (s < 50) {
      spot = game.players[game.off_num].team.abrv + ' ' + s
    } else if (s > 50) {
      spot = game.players[game.def_num].team.abrv + ' ' + (100 - s)
    }

    return spot
  };

  setStatus (game, p1, p2) {
    let stat = 0
    const ono = game.off_num

    if ('SRLRSPLP'.includes(p1) && 'SRLRSPLP'.includes(p2)) {
      stat = 11
    }

    if (!stat) {
      if (p1 === 'HM' || p2 === 'HM') {
        stat = 17
      } else if (p1 === 'FG' || p2 === 'FG') {
        stat = 15
      } else if (p1 === 'PT' || p2 === 'PT') {
        stat = 16
      }
    }

    if (!stat) {
      if (p1 === 'TP') {
        stat = ono === 1 ? 12 : 13
      } else if (p2 === 'TP') {
        stat = ono === 1 ? 13 : 12
      } else {
        stat = 11
      }
    }

    return stat
  };

  async doPlay (game, p1, p2) {
    if (game.status >= 11 && game.status <= 13) {
      this.regPlay(game, p1, p2)
    }

    if (game.status === 14) {
      await this.samePlay(game)
    } else if (game.status >= 12 && game.status <= 13) {
      await this.trickPlay(game)
    } else if (game.status === 15) {
      await this.fieldGoal(game, game.off_num)
    } else if (game.status === 16) {
      await this.punt(game, game.off_num, 16)
    } else if (game.status === 17) {
      await this.hailMary(game)
    }
  };

  regPlay (game, pl1, pl2) {
    // hno = game.home;  // Used for scoreboard updating
    // let report = 'Here are the plays...\n' + pl1 + ' vs. ' + pl2;

    this.drawPlay(game, 1, pl1)
    this.drawPlay(game, 2, pl2)

    // If both players picked the same play, 50/50 chance of Same Play Mechanism
    if (pl1 === pl2) {
      if (pl1 === 'TP' || Utils.coinFlip()) {
        // 14 = Same Play
        game.status = 14
      }
    }

    // await this.alertBox(report);
  };

  drawPlay (game, plr, play) {
    // console.log('drawPlay');
    // const cardNum = "SRLRSPLPTPHM".indexOf(play) / 2;
    // game.players[plr].decPlays(cardNum);
    game.players[plr].decPlays(play)
    // console.log(game.players[plr].plays);
  };

  async samePlay (game) {
    const coin = Utils.coinFlip()
    let multCard = null

    await this.alertBox('Same play!')
    multCard = game.decMults()

    if (multCard.card === 'King') {
      await this.bigPlay(game, coin ? game.off_num : game.def_num)
    } else if ((multCard.card === 'Queen' && coin) || (multCard.card === 'Jack' && !coin)) {
      game.thisPlay.multiplier = 3
    } else if ((multCard.card === 'Queen' && !coin) || (multCard.card === 'Jack' && coin)) {
      game.thisPlay.multiplier = -3
    } else {
      if (coin) {
        await this.alertBox('Picked!')
        await this.changePoss(game, 'to')
      }
      game.thisPlay.dist = 0
      game.thisPlay.yard_card = '/'
    }
  };

  returnTime (last) {
    this.game.players[last].timeouts++
    console.log('Timeout returned to ' + this.game.players[last].team.name + '...')
    // LATER: Graphically show timeout returning on scoreboard
  }

  async bigPlay (game, num) {
    const die = Utils.rollDie()

    // Offensive Big Play
    if (game.off_num === num) {
      if (die >= 1 && die <= 3) {
        game.thisPlay.dist = 25
      } else if (die === 6) {
        game.thisPlay.dist = 101 // Touchdown
      } else { // die === 4 && die === 5
        if ((100 - game.spot) / 2 > 40) { // Half the field or 40, whichever is more
          game.thisPlay.dist = Math.round((100 - game.spot) / 2)
        } else {
          game.thisPlay.dist = 40
        }
      }
      // Defense
    } else {
      if (die >= 1 && die <= 3) {
        // If timeout called, return
        if (game.time_change === 4) {
          this.returnTime(game.last_call_to)
        }

        game.time_change = 2

        if (game.spot - 10 < 1) {
          game.thisPlay.dist = -Math.trunc(game.spot / 2) // Half the distance to the goal
        } else {
          game.thisPlay.dist = -10 // 10-yard penalty on off
        }
      } else {
        if (die === 6) {
          await this.alertBox('FUMBLE!!!')
          game.thisPlay.dist = 101 // Touchdown
        } else { // die === 4 && die === 5
          await this.alertBox('FUMBLE!!')
          if ((100 - game.spot) / 2 > 25) { // Half the field or 25, whichever is more
            game.thisPlay.dist = Math.round((100 - game.spot) / 2)
          } else {
            game.thisPlay.dist = 25
          }
        }
        await this.changePoss(game, 'to')
      }
    }

    // Prevent calculations
    game.thisPlay.multiplier_card = '/'
    game.thisPlay.yard_card = '/'
    game.thisPlay.multiplier = '/'
  }

  async trickPlay (game) {
    const die = Utils.rollDie()
    await this.alertBox((game.status === 12 ? game.players[game.off_num].team.name : game.players[game.def_num].team.name) + ' trick play!')

    if (die === 2) {
      // If timeout called, return
      if (game.time_change === 4) {
        this.returnTime(game.last_call_to)
      }
      game.time_change = 2

      // Offense Trick Play
      if (game.status === 12) {
        if (game.spot + 15 > 99) {
          game.thisPlay.dist = Math.trunc((100 - game.spot) / 2) // Half the distance to the goal
        } else {
          game.thisPlay.dist = 15 // 15-yard penalty on def
        }
        // Defense
      } else {
        if (game.spot - 15 < 1) {
          game.thisPlay.dist = -Math.trunc(game.spot / 2) // Half the distance to the goal
        } else {
          game.thisPlay.dist = -15 // 15-yard penalty on off
        }
      }

      // Prevent calcuations
      game.thisPlay.multiplier_card = '/'
      game.thisPlay.yard_card = '/'
    } else if (die === 3) {
      game.thisPlay.multiplier_card = '/'
      game.thisPlay.multiplier = -3
    } else if (die === 4) {
      game.thisPlay.multiplier_card = '/'
      game.thisPlay.multiplier = 4
    } else if (die === 5) {
      this.bigPlay(game, game.status === 12 ? game.off_num : game.def_num)
      // die === 1 && die === 6
    } else {
      if (game.status === 12) {
        game.thisPlay.bonus = 5
      } else {
        game.thisPlay.bonus = -5
      }

      // Place play based on die roll
      game.players[(game.status === 12 ? game.off_num : game.def_num)].currentPlay = die === 1 ? 'LP' : 'LR'
    }
  };

  async fieldGoal (game, ono) {
    const name = game.players[game.off_num].team.name
    let make = true
    const spt = 100 - game.spot
    const fdst = spt + 17
    let die = Utils.rollDie()

    await this.alertBox(name + ' attempting a ' + fdst + '-yard field goal...')

    // Ice kicker
    if (game.time_change === 4 && game.last_call_to !== game.off_num) {
      die++
      console.log('Kicker iced!')
    }

    if (fdst > 65) {
      const tmp = Utils.randInt(1, 1000)
      make = tmp === fdst // 1 in 1000 chance you get fdst
    } else if ((fdst >= 60 && die < 6) || (fdst >= 50 && die < 5) || (fdst >= 40 && die < 4) || (fdst >= 30 && die < 3) || (fdst >= 20 && die < 2)) {
      make = false
    }

    // LATER: Field goal graphics will go here

    if (make) {
      await this.alertBox(name + ' field goal is good!')
      this.scoreChange(game, ono, 3)
      if (game.isOT()) {
        // Maybe the graphics are different here
      } else {
        game.status = -3
      }
    } else {
      await this.alertBox(name + ' field goal is no good...')
      if (!game.isOT()) {
        await this.changePoss(game, 'fg')
      }
    }

    // LATER: addRecap()
    // addRecap(..., fdst + '-yd FG ' + (make ? 'good' : 'missed'));

    if (game.isOT()) {
      game.ot_poss = -Math.abs(game.ot_poss)
    }
  };

  async punt (game, ono, stat) {
    const oName = game.players[game.off_num].team.name
    const dName = game.players[game.def_num].team.name
    let block = false
    let touchback = false
    let possession = true
    let kickDist = 0
    let retDist = 0

    // Safety Kick
    if (game.status === -4) {
      // Probably reset graphics
      game.spot = 35
      // moveBall('s');
      // Punt
    } else {
      // Add Recap for punt, maybe remove first down sticks
    }

    // printDown('PUNT');
    await this.alertBox(oName + (game.status === -4 ? ' safety kick' : ' are punting') + '...')

    // Check block (not on Safety Kick)
    if (game.status !== -4 && Utils.rollDie() === 6) {
      if (Utils.rollDie() === 6) { // 1 in 36 chance, must roll TWO sixes in a row
        block = true
      }
    }

    // Get yard card
    if (!block) {
      // Yard card times 10 and, if heads, add 20
      kickDist = 10 * game.decYards() / 2 + 20 * Utils.coinFlip()

      // Check for touchbacks
      if (game.spot + kickDist > 100) {
        touchback = true
      }
    }

    await this.alertBox('The punt is up...')

    if (touchback) {
      await this.alertBox('Deep kick!')
      // moveBall('c');
    } else if (block) {
      await this.alertBox(dName + ' blocked the punt!!!')
      // addRecap( blocked punt )
      // Regular punt/safety kick
    } else {
      game.thisPlay.dist = kickDist
      // moveBall('k');
    }

    game.spot += kickDist

    // Check muff, but not on safety kick
    if (!touchback && !block && game.status !== -4 && Utils.rollDie() === 6) {
      if (Utils.rollDie() === 6) {
        possession = false
      }
    }

    if (possession) {
      if (touchback) {
        await this.changePoss(game, 'k')
      } else {
        await this.changePoss(game, 'pnt')
      }
    } else {
      await this.alertBox(dName + ' muffed the kick!\n' + oName + ' recover the ball...')
      // addRecap( muffed punt )
      // record turnover to def_num
    }

    // Return
    let msg = 'The return:\n'

    if (possession && !touchback && !block) {
      const mltCard = game.decMults().card
      const yrd = game.decYards()
      let mlt = -0.5

      if (mltCard === 'King') {
        mlt = 7
      } else if (mltCard === 'Queen') {
        mlt = 4
      } else if (mltCard === 'Jack') {
        mlt = 1
      }

      retDist = Math.round(mlt * yrd)

      if (retDist === 0) {
        msg += 'No return.'
      } else {
        if (game.spot + retDist >= 100) {
          game.status = 101
          // addRecap( punt ret TD )
          retDist = 100 - game.spot
        } else if (game.spot + retDist <= 0) {
          game.status = 102
          // addRecap( punt ret safety )
          retDist = -game.spot
        }

        game.thisPlay.dist = retDist
        // moveBall('k');
        game.spot += retDist

        msg += dName + ' return for ' + retDist + ' yards.'
      }
    } else if (touchback) {
      msg += dName + ' takes a touchback...'
      game.spot = 20
      // moveBall('s')  // Maybe
    }

    // If you didn't score, post-punt
    if (game.status === -4 || game.status === 16) {
      game.status = 6
      game.down = 0 // CHECK: This is a band-aid
    }

    await this.alertBox(msg)
  };

  async hailMary (game) {
    const die = Utils.rollDie()
    let msg = null
    let dst = 0

    await this.alertBox(game.players[game.off_num].team.name + ' hail mary!')
    document.querySelector('.' + (game.away === game.off_num ? 'away' : 'home') + ' .hm' + game.players[game.off_num].hm).classList.add('called')

    if (die === 1) {
      msg = 'BIG SACK!'
      dst = -10
    } else if (die === 2) {
      dst = 20
    } else if (die === 3) {
      dst = 0
    } else if (die === 4) {
      dst = 40
    } else if (die === 5) {
      msg = 'PICKED!'
      await this.changePoss(game, 'to')
    } else {
      dst = 101
    }

    if (msg) {
      await this.alertBox(msg)
    }

    game.thisPlay.multiplier_card = '/'
    game.thisPlay.yard_card = '/'
    game.thisPlay.multiplier = '/'
    game.thisPlay.dist = dst

    game.players[game.off_num].hm--
  };

  // END OF PLAY - WE HAVE THE DATA, LET'S GO!!!
  async endPlay (game) {
    const p1 = game.players[1].currentPlay
    const p2 = game.players[2].currentPlay

    if ((game.status > 10 && game.status <= 14) || game.status === 17) {
      this.calcDist(game, p1, p2)

      console.log('Play over - ball is moving...')
      await this.reportPlay(game, p1, p2)

      // if (!game.two_point && game.status < 15 || game.status > 16) {
      //     saveDist(game.off_num)  // LATER: When we have stats
      // }

      if (game.two_point) {
        game.spot = game.thisPlay.dist + game.spot
      }
    }

    // await this.animationWaitForCompletion(this.fieldContainer, 'slide-away')
    this.setBallSpot()

    await this.checkScore(game, game.thisPlay.bonus, game.thisPlay.dist)

    console.log('Updating scoreboard...')
    if (!game.isOT() && game.ot_poss < 0 && !game.two_point && (game.status < 15 || game.status === 17)) {
      await this.updateDown(game)
    }

    if (!game.two_point) {
      this.timeChange(game)
    }

    // await this.alertBox('Teams huddling up...\nPress Enter...\n');

    if (game.status > 0 && game.status < 10) {
      game.status = 11
    }
    console.log(game.status)
    // }
  };

  calcDist (game, p1, p2) {
    console.log('Drawing cards...')

    if (game.thisPlay.multiplier_card === 999) {
      game.thisPlay.multiplier_card = game.decMults()
    }

    if (game.thisPlay.yard_card === 999) {
      game.thisPlay.yard_card = game.decYards()
    }

    if (game.thisPlay.multiplier === 999 && game.thisPlay.multiplier_card === '/') {
      game.thisPlay.multiplier = '/'
    } else if (game.thisPlay.multiplier_card !== '/') {
      game.thisPlay.multiplier = this.calcTimes(game, p1, p2, game.thisPlay.multiplier_card.num)
    }

    if (game.thisPlay.dist === 999) {
      game.thisPlay.dist = Math.round(game.thisPlay.yard_card * game.thisPlay.multiplier) + game.thisPlay.bonus
    }

    // Test TDs
    // game.spot = 1000;

    // Check for touchdowns
    if (game.spot + game.thisPlay.dist >= 100) {
      game.thisPlay.bonus = game.thisPlay.dist
      game.thisPlay.dist = 100 - game.spot
      if (!game.two_point) {
        game.status = 101
      }
    }

    // Check for safeties
    if (game.spot + game.thisPlay.dist <= 0) {
      game.thisPlay.bonus = game.thisPlay.dist
      game.thisPlay.dist = -game.spot
      if (!game.two_point) {
        game.status = 102
      }
    }
  };

  calcTimes (game, p1, p2, multIdx) {
    const p1Num = 'SRLRSPLPTP'.indexOf(p1) / 2
    const p2Num = 'SRLRSPLPTP'.indexOf(p2) / 2
    let match = 0

    if (p1Num === 4 || p2Num === 4) {
      match = 1
    } else {
      match = MATCHUP[game.off_num === 1 ? p1Num : p2Num][game.off_num === 1 ? p2Num : p1Num]
    }

    return MULTI[multIdx - 1][match - 1]
  };

  async reportPlay (game, p1, p2) {
    const times = game.thisPlay.multiplier === 999 ? '/' : null
    const mCard = game.thisPlay.multiplier_card === '/' ? '/' : game.thisPlay.multiplier_card.card
    const elPlCard2 = document.querySelector('.pl-card2')
    const elMultCard = document.querySelector('.mult-card')
    const elYardCard = document.querySelector('.yard-card')
    const elTimesCont = document.querySelector('.times-container')

    document.querySelector('.' + (game.away === game.off_num ? 'home-msg' : 'away-msg') + '.top-msg').innerText = 'Last play: ' + p1 + ' v ' + p2
    document.querySelector('.' + (game.home === game.off_num ? 'home-msg' : 'away-msg') + '.top-msg').innerText = 'Distance: ' + game.thisPlay.dist + '-yard ' + (game.thisPlay.dist >= 0 ? 'gain' : 'loss')
    // await this.slideBoard()

    // This is it, but not right order, probably

    // await this.animationWaitForCompletion(this.fieldContainer, 'slide-away')

    elPlCard2.innerText = game.players[2].currentPlay
    await this.animationWaitForCompletion(elPlCard2, 'picked')
    elMultCard.innerText = mCard
    await this.animationWaitForCompletion(elMultCard, 'picked')
    elYardCard.innerText = game.thisPlay.yard_card
    await this.animationWaitForCompletion(elYardCard, 'picked')
    elTimesCont.innerText = (times || game.thisPlay.multiplier) + 'X'
    await this.animationWaitForCompletion(elTimesCont, 'picked')

    // await this.animationWaitForCompletion(this.fieldContainer, 'slide-away')
    this.setBallSpot()

    // await this.alertBox('Multiplier Card: ' + mCard + '\nYard Card: ' + game.thisPlay.yard_card + '\nMultiplier: ' + (times || game.thisPlay.multiplier) + 'X\n')

    // const field = document.querySelector('.field-container')
    // // field.addEventListener('transitionend', () => {

    // // })
    // if (field.classList.contains('slide-away')) {
    //   field.classList.remove('slide-away')
    // //   field.style.display = 'block'
    // } else {
    //   field.classList.add('slide-away')
    // //   field.style.display = 'none'
    // }

    // alert('Player 1: ' + p1 + ' vs. Player 2: ' + p2 + '\nMultiplier Card: ' + mCard + '\nYard Card: ' + game.thisPlay.yard_card + '\nMultiplier: ' + (times ? times : game.thisPlay.multiplier) + 'X\nDistance: ' + game.thisPlay.dist + ' yard' + (game.thisPlay.dist !== 1 ? 's' : '') + '\nTeams are huddling up. Press Enter...\n');
  };

  async checkScore (game, bon, dst) {
    const ono = game.off_num
    const dno = game.def_num
    const oname = game.players[ono].team.name
    const dname = game.players[dno].team.name
    let good = false
    let coin

    // Two-Point Conversion
    if (game.two_point) {
      if (game.spot + game.thisPlay.dist >= 100 && !game.turnover) {
        if (bon > dst) {
          good = true
        } else if (bon === dst) {
          coin = Utils.coinFlip()

          if (coin) {
            good = true
          }
        }

        if (good) {
          await this.alertBox(oname + ' 2-point conversion good!')
          this.scoreChange(game, ono, 2)
        } else {
          if (game.time_change < 2 || game.time_change > 3) {
            await this.alertBox(oname + ' 2-point conversion no good!')
          }
        }
      } else if ((game.spot + dst <= 0 || game.spot + dst >= 100) && game.turnover) {
        await this.alertBox(dname + ' returned 2-pt!!!')
        this.scoreChange(game, dno, 2)
      } else {
        if (game.time_change < 2 || game.time_change > 3) {
          await this.alertBox(oname + ' 2-point conversion no good!')
        }
      }

      if (game.time_change < 2 || game.time_change > 3) {
        game.two_point = false
        if (!game.isOT()) {
          game.status = -3
        } else {
          game.status = 11
        }
      }
    }

    if (game.status === 101) {
      await this.touchdown(game)
    }

    if (game.status === 102) {
      await this.safety(game)
    }
  };

  scoreChange (game, scrNo, pts) {
    // This is going to include a lot of action
    // that will update the scoreboard

    // All that's needed for logic
    game.players[scrNo].score += pts

    // Also add to the stats at this point
    // Add to the quarter score for the game recap
  };

  async safety (game) {
    await this.alertBox(game.players[game.def_num].team.name + ' forced a safety!!')
    this.scoreChange(game, game.def_num, 2)
    if (game.isOT()) {
      game.ot_poss = 0
    } else {
      game.status = -4
    }
    // addRecap( safety )
  };

  async touchdown (game) {
    await this.alertBox(game.players[game.off_num].team.name + ' scored a touchdown!!!')
    this.scoreChange(game, game.off_num, 6)
    this.showBoard(document.querySelector('.scoreboard-container'))

    // addRecap ( touchdown )
    // debugger
    if (this.patNec(game)) {
      await this.pat(game)
    }

    if (game.isOT()) {
      game.ot_poss = -game.ot_poss
    }
  };

  // QUESTION FOR DANIEL
  patNec (game) {
    const endGameNoTO = game.qtr === 4 && game.current_time === 0 && game.time_change !== 4
    const endOT = game.isOT() && (game.ot_poss === 1 || (game.ot_poss === 2 && game.turnover))
    const scoreDiff = game.players[game.off_num].score > game.players[game.def_num].score || game.players[game.def_num].score - game.players[game.off_num].score > 2

    return !((endGameNoTO || endOT) && scoreDiff)
    // return !(endGameNoTO || endOT) || !scoreDiff;
    // return !endGameNoTO && !endOT || !scoreDiff;
  };

  async pat (game) {
    const oNum = game.off_num
    const oName = game.players[oNum].team.name
    let selection = '2P' // Default in 3OT+

    if (game.qtr < 7) { // Must go for 2 in 3OT+
      if (game.isReal(oNum)) {
        await this.playPages(game, oNum, 'pat')
      } else {
        await this.cpuPages(game, 'xp')
      }

      selection = game.players[oNum].currentPlay
    }
    if (game.isReal(oNum) && !this.cardsContainer.classList.contains('slide-down')) {
      this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
    }

    if (selection === '2P') {
      // printDown('2PT');
      game.spot = 98
      // moveBall('s');
      if (game.time_change !== 4) {
        game.time_change = 7 // Two-point
      }
      game.two_point = true
    } else {
      // printDown('XP');
      let die = Utils.rollDie()
      if (die === 6) {
        die = Utils.coinFlip()
        if (!die) {
          die = 6
        }
      }
      // printFG(die !== 6);

      if (die !== 6) {
        await this.alertBox(oName + ' XP good!')
        this.scoreChange(game, oNum, 1)
      } else {
        await this.alertBox(oName + ' XP no good...')
        // Might need some graphics here
      }

      // addRecap( xp [no] good );

      if (!game.isOT()) {
        game.status = -3 // Get ready for kickoff
      } else {
        game.status = 11 // Get ready for next OT play
      }
    }
  };

  async updateDown (game) {
    let coin

    if (game.down !== 0) {
      console.log('Update down: ' + game.spot)
      game.spot += game.thisPlay.dist
      console.log(game.spot)
    }

    // if (game.spt != 0 || game.status > 0 && game.status < 10) { // Update the spot }

    // Sticks
    if (game.spot === game.fst_down) {
      await this.alertBox('Sticks...')
      coin = Utils.coinFlip()

      if (!coin) {
        await this.alertBox('Almost!')
      }
    }

    if (game.down === 0) {
      coin = 1
    }

    if (game.spot > game.fst_down || coin) {
      if (game.down !== 0) {
        await this.alertBox('First down!')
        // print_down(game);
      }
      game.down = 1

      if (game.spot > 90) {
        game.fst_down = 100
      } else {
        game.fst_down = game.spot + 10
      }

      // print_down(game);
      // document.querySelector('.page-subheader').innerText = this.showBoard();

      if (game.status > 10) {
        // LATER: Inc player's first downs here
      }

      coin = 1
    }

    if (!coin && game.time_change !== 2) {
      game.down += 1
    }

    if (game.down > 4) {
      await this.alertBox('Turnover on downs!!!')
      await this.changePoss(game, 'to')

      game.down = 1
    }

    // print_down(game);
    // document.querySelector('.page-selection2').innerText = this.showBoard();
    this.showBoard(document.querySelector('.scoreboard-container'))
  };

  timeChange (game) {
    console.log('timeChange')
    if (game.qtr <= 4 && game.time_change === 0) {
      game.current_time -= 0.5
      console.log(game.current_time)
      // Inc TOP for offense
      // print_time(game.current_time);
    }

    // LATER: Add this for OT
    // if (game.ot_poss < 0) {
    //     if (game.isOT() && game.ot_poss_switch(qtr, ono, rec_first, ot_poss)) {
    //         changePoss(game, 'ot');
    //     } else {
    //         this.ot_poss_switch2()
    //         game.ot_poss = Math.abs(game.ot_poss) - 1;
    //     }
    // }

    if (game.qtr > 4 && game.ot_poss === 0) {
      game.current_time = -0.5
    }
    // document.querySelector('.page-selection2').innerText = this.showBoard();
    this.showBoard(document.querySelector('.scoreboard'))
  };

  async gameControl (game) {
    // The game just started
    if (game.status === 0) { // if (game.state === REG_START || game.state === OTC_START) {
      await this.coinToss(game)

      if (!game.isOT() || game.game_type === 'otc') { // if (game.state === OTC_START) {
        await this.resetVar(game)
      }

      await this.animationWaitForCompletion(this.scoreboardContainer, 'slide-up')
    } else {
      // End of half
      // if (game.state === END_QTR && game.qtr === 3) {
      if (game.status === 0 || (!(game.qtr % 2))) {
        await this.resetVar(game)
      }

      // End of odd quarter (1st, 3rd, OT) || But do we need this for OTC?
      // if (game.state === END_QTR || (game.state === END_OT && game.qtr % 2)
      if (game.qtr % 2 && game.current_time !== game.qtr_length) {
        if (!game.isOT() || (game.isOT() && game.ot_poss !== 2)) {
          await this.resetTime(game) // CHECK: This was a band-aid
        }
      }
    }

    // Skip if exited during Coin Toss
    if (game.status < 900) {
      // Set up OT Challenge
      // if (game.state === OTC_START) {
      if (game.qtr === 5 && game.game_type === 'otc' && game.rec_first !== game.off_num) {
        await this.changePoss(game)
        // print_needle(-game.off_num);
        game.ot_poss = 2
      }
    }
  };

  async coinToss (game) {
    const awayName = game.players[game.away].team.name
    const homeName = game.players[game.home].team.name
    let coinPick = null
    let result = ''
    let actFlip = null
    let decPick = null
    let recFirst = 'away'

    // LATER: Move this
    // await this.animationWaitForCompletion(this.scoreboardContainer, 'slide-away')
    // this.animationSimple(this.scoreboardContainer, 'slide-away')

    // Coin toss decision
    if (game.isReal(game.away)) {
      await this.alertBox(awayName + ' pick [H] or [T] for coin toss...')
      if (this.cardsContainer.classList.contains('slide-down')) {
        this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
      }
      coinPick = await this.input.getInput(game, game.away, 'coin', awayName + ' pick for coin toss...')
      if (!this.cardsContainer.classList.contains('slide-down')) {
        this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
      }
    } else { // Computer picking
      await this.alertBox('Coin Toss\n' + awayName + ' choosing...\n')
      coinPick = Utils.coinFlip() ? 'H' : 'T'
    }

    // Show result
    result += awayName + ' chose ' + (coinPick === 'H' ? 'heads' : 'tails') + '!\n'
    result += 'Coin toss!!!\n\n\n\n\n'
    // Some sort of graphic
    actFlip = Utils.coinFlip() ? 'H' : 'T'
    result += 'It was ' + (actFlip === 'H' ? 'heads' : 'tails') + '...'
    await this.alertBox(result)

    if (game.num_plr === 2 || (actFlip === coinPick && game.away === 1) || (actFlip !== coinPick && game.home === 1)) {
      if (this.cardsContainer.classList.contains('slide-down')) {
        this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
      }

      decPick = await this.input.getInput(game, (actFlip === coinPick ? game.away : game.home), (game.qtr >= 4 ? 'kickDecOT' : 'kickDecReg'))
      if (!this.cardsContainer.classList.contains('slide-down')) {
        this.animationWaitForCompletion(this.cardsContainer, 'slide-down')
      }
      if (!this.fieldContainer.classList.contains('slide-away')) {
        this.animationWaitForCompletion(this.fieldContainer, 'slide-away')
      }
    } else { // Computer choosing
      await this.alertBox((actFlip === coinPick ? awayName : homeName) + ' choosing...')

      decPick = Utils.randInt(1, 2)
      if (!(game.qtr >= 4)) {
        decPick = decPick === 1 ? 'K' : 'R'
      }
    }

    result = (actFlip === coinPick ? awayName : homeName) + ' '

    if (game.qtr >= 4) {
      if (decPick === '1') {
        result += 'get ball 1st'
      } else {
        result += 'get ball 2nd'
      }
    } else {
      if (decPick === 'K') {
        result += ' will kick'
      } else {
        result += ' will receive'
      }
    }

    result += '...\n'
    await this.alertBox(result)

    if ((actFlip === coinPick && (decPick === '2' || decPick === 'K')) || (coinPick !== actFlip && (decPick === '1' || decPick === 'R'))) {
      recFirst = 'home'
    }

    game.rec_first = recFirst === 'home' ? game.home : game.away
    game.def_num = game.rec_first // Because they're receiving first
    game.off_num = game.opp(game.def_num) // Because they're kicking

    if (game.qtr >= 4) {
      if (game.game_type !== 'otc') {
        // Might need this for graphic resetting later
      }
      game.status = 11
      game.current_time = 0
    }

    // await this.animationWaitForCompletion(this.scoreboardContainer, 'slide-up')
  };

  // What ALL is this function doing?
  async resetVar (game) {
    if (game.qtr === 0 || (game.qtr === 4 && game.game_type === 'otc')) {
      // displayBoard()
      // printNames()
      for (let p = 1; p <= 2; p++) {
        game.players[p].score = 0
        // printScore(p);
        // game.players[p].stats.totalYards = 0;
        // game.players[p].stats.passYards = 0;
        // game.players[p].stats.runYards = 0;
        // game.players[p].stats.timePoss = 0;
        // game.players[p].stats.firstDowns = 0;
        // game.players[p].stats.turnovers = 0;
        // game.players[p].stats.qtrScore = 0;
      }
      // Add initial entry to addRecap( initial );
      // Make a spot to store the scores for each qtr

      // OT Challenge Stuff
      // This could be more elegant
      if (game.qtr === 4) {
        game.down = 0
        await this.updateDown(game) // Forces game to set itself up
      }
    }

    // Need the equivalent of fillBoard to add all cards

    let to = 3
    let hm = 3
    if (game.qtr >= 4) {
      to = 1
      hm = 2
    }
    game.players[1].timeouts = to
    game.players[2].timeouts = to
    game.players[1].hm = hm
    game.players[2].hm = hm

    // Refill timeout pills
    for (let t = 1; t <= to; t++) {
      for (let p = 1; p <= 2; p++) {
        if (document.querySelector('.' + (game.away === p ? 'away' : 'home') + ' .to' + t).classList.contains('called')) {
          document.querySelector('.' + (game.away === p ? 'away' : 'home') + ' .to' + t).classList.remove('called')
        }
      }
    }

    // Refill hail mary pills
    for (let h = 1; h <= hm; h++) {
      for (let p = 1; p <= 2; p++) {
        if (document.querySelector('.' + (game.away === p ? 'away' : 'home') + ' .hm' + h).classList.contains('called')) {
          document.querySelector('.' + (game.away === p ? 'away' : 'home') + ' .hm' + h).classList.remove('called')
        }
      }
    }

    if (game.qtr <= 3) {
      // Ready to kickoff
      game.status = -1
      // BAND-AID
      // game.qtr = 1;
      // updateDown(game);
    }

    if (game.qtr === 4 && game.game_type !== 'otc' && game.players[1].score === game.players[2].score) {
      await this.coinToss(game)
    }

    await this.resetTime(game)

    if (!game.over) {
      if (!game.isOT()) {
        // document.querySelector('.page-selection2').innerText = this.showBoard();
        this.showBoard(document.querySelector('.scoreboard-container'))
      }

      if (game.qtr === 3 && game.off_num !== game.rec_first) {
        await this.changePoss(game)
      }
      // printNeedle(-game.off_num);

      // Make sure plays are set right for OT challenge, esp hail marys
    }
  };

  // What all is THIS function doing
  async resetTime (game) {
    const over = game.qtr >= 4 && game.players[1].score !== game.players[2].score

    // Is the game over?
    if (over) {
      await this.endGame(game)
    // No, then let's increase the quarter
    } else {
      if (game.qtr !== 0 && !(game.qtr === 4 && game.game_type === 'otc')) {
        // LATER: Record quarter score here
      }

      if (game.qtr !== 0) {
        await this.alertBox('Quarter end...')

        // Used to check !over, but you should never get there
        if (!(game.qtr % 2) && !(game.qtr === 4 && game.game_type === 'otc')) {
          await this.alertBox('Halftime shuffle...')
          // LATER: Stat review statBoard(game);
        }
      }

      // Get ready for OT or reset clock for next qtr
      if (game.qtr >= 4) {
        game.current_time = 0
        game.ot_poss = 2
        game.spot = 75
        game.fst_down = 85
        // moveBall('s');
        // printDown(game);
      } else {
        game.current_time = game.qtr_length
      }

      game.qtr++
      // document.querySelector('.page-selection2').innerText = this.showBoard();
      this.showBoard(document.querySelector('.scoreboard-container'))

      // LATER: Set qtr score
      // Could update the spot and/or print new qtr

      if (game.isOT() && this.ot_qtr_switch(game)) {
        await this.changePoss(game, 'nop')
        // print_needle(-game.off_num);
        // First OT needs a little help
        if (game.ot_poss === -2 && game.qtr === 5) {
          game.ot_poss = 2
        }
      }
    }
  };

  ot_qtr_switch (game) {
    const qtrEven = !(game.qtr % 2)
    const offRecdFirst = game.off_num === game.rec_first
    let swtch = false

    if ((!qtrEven && !offRecdFirst && game.ot_poss === 2) || (qtrEven && offRecdFirst && game.ot_poss === 2)) {
      swtch = true
    }

    return swtch
  }

  async endGame (game) {
    const winner = (game.players[1].score > game.players[2].score) ? 1 : 2
    const wName = game.players[winner].team.name

    // printQtr('FINAL');
    // display game over
    // statBoard()
    // record final qtr scores
    await this.alertBox(wName + ' win the game ' + game.players[winner].score + ' - ' + game.players[game.opp(winner)].score + '!!!')
    game.status = 900 + winner
    // this.EnablePlayButton(document.querySelector('.playButton'));
    // fireworks();
    // storeStats(winner, false);
  };

  ot_poss_switch (game) {
    const qtrEven = !(game.qtr % 2)
    const offEqRec = game.off_num === game.rec_first
    const otp = game.ot_poss
    let possSwitch = false

    if (!qtrEven && offEqRec && otp === -2 || !qtrEven && !offEqRec && otp === -1 || qtrEven && !offEqRec && otp === -2 || qtrEven && offEqRec && otp === -1) {
      possSwitch = true
    }

    return possSwitch
  };
}
