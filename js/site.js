export default class Site {
  constructor (root) {
    this.user = null // ADD: User class
    this.game = null // Set to current game
    this.numberPlayers = null
    this.connectionType = 'local' // or 'remote'
    this.host = false // or true
    this.channel = null // or Pusher channel
    this.team1 = null // or Team object
    this.team2 = null // or Team object
    this.gameType = 'reg' // or 'otc'
    this.quarterLength = 7 // or some other int (1-15)
    this.gameMode = 'rookie' // or 'pro'
  }
}
