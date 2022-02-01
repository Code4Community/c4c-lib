function enterButtonHoverState(btn) {
  btn.setStyle({ fill: "#ff0" });
}

function enterButtonRestState(btn) {
  btn.setStyle({ fill: "#fff" });
}

function popup(config) {
  if (config.pausing) {
    config.mainScene.scene.pause();
  }

  const popupContainer = config.uiScene.add.container(400, 300, []);

  const popupText = config.uiScene.add.text(0, 0, config.text, {
    fill: "#fff",
    fontSize: "25px",
  });

  if (config.hasButton) {
    const midPoint = popupText.width / 2;
    const closeButton = config.uiScene.add
      .text(midPoint, 60, "OK", { fill: "#fff", fontSize: "20px" })
      .setInteractive()
      .on("pointerdown", () => {
        popupContainer.destroy();
        config.mainScene.scene.resume();
      })
      .on("pointerover", () => enterButtonHoverState(closeButton))
      .on("pointerout", () => enterButtonRestState(closeButton));

    closeButton.x -= closeButton.width / 2;
    closeButton.y -= closeButton.height / 2;

    popupContainer.add(closeButton);
  }

  popupContainer.add(popupText);
  popupContainer.setSize(popupText.width, popupText.height);

  popupContainer.x -= popupContainer.width / 2;
  popupContainer.y -= popupContainer.height / 2;
}

export { popup };
