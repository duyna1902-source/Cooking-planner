// Reusable teaching widgets. This is a plain JavaScript model, not a React runtime.
document.querySelectorAll('[data-quiz]').forEach(quiz => {
  const feedback = quiz.querySelector('[data-feedback]');
  quiz.querySelectorAll('[data-answer]').forEach(button => {
    button.addEventListener('click', () => {
      quiz.querySelectorAll('[data-answer]').forEach(choice => {
        delete choice.dataset.result;
        choice.setAttribute('aria-pressed', 'false');
      });
      const correct = button.dataset.answer === quiz.dataset.correct;
      button.dataset.result = correct ? 'correct' : 'incorrect';
      button.setAttribute('aria-pressed', 'true');
      feedback.textContent = correct ? quiz.dataset.success : quiz.dataset.retry;
    });
  });
});

document.querySelectorAll('[data-tab-trace]').forEach(widget => {
  let activeTab = 'plan';
  const output = widget.querySelector('[data-state]');
  const log = widget.querySelector('[data-trace-log]');
  const draw = () => {
    output.textContent = `activeTab = '${activeTab}'`;
    widget.querySelectorAll('[data-screen]').forEach(screen => {
      screen.hidden = screen.dataset.screen !== activeTab;
    });
    widget.querySelectorAll('[data-tab]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.tab === activeTab));
    });
  };
  widget.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      const next = button.dataset.tab;
      const previous = activeTab;
      const lines = next === previous
        ? [`Bạn bấm tab đang chọn: '${next}'.`, 'Giá trị state không đổi.', 'Không cần chuyển sang màn hình khác.']
        : [`BottomNav: onTabChange('${next}').`, `Hàm được truyền từ App: setActiveTab('${next}').`, `State trong App: '${previous}' → '${next}'.`, `React tính lại giao diện; nhánh ${next === 'plan' ? 'PlanView' : 'MenuView'} được chọn.`];
      activeTab = next;
      log.replaceChildren(...lines.map(line => {
        const item = document.createElement('li');
        item.textContent = line;
        return item;
      }));
      draw();
    });
  });
  draw();
});
