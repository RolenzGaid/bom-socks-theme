theme.announcement = (function () {
  function announcementModule(e) {
    let announcementList = e.querySelectorAll(".announcement-bar");
    announcementList.forEach((element) => {
      element.addEventListener("click", (evt) => {
        evt.stopPropagation();
        let evtTargetElement = evt.target;
        if (evtTargetElement.classList.contains("close__announcement--bar") || evtTargetElement.closest(".close__announcement--bar")) {
          const removalElement = evtTargetElement.closest(".announcement-bar")
          removalElement.remove();
          evtTargetElement.parentElement.remove();
        }
      });
    });
  }
  return announcementModule;
})();
