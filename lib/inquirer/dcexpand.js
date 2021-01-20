const ExpandPrompt = require('inquirer/lib/prompts/expand');

class DCExpandPrompt extends ExpandPrompt {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    // remove help prompt if auto expanding
    if (this.opt.expanded)
      this.opt.choices.choices.splice(this.opt.choices.choices.length - 1, 1);

    this.status = this.opt.expanded ? 'expanded' : 'pending';
  }
}

module.exports = DCExpandPrompt;
