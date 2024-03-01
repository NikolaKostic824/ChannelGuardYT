/**
 * Continuously monitors the YouTube page for dynamic content changes (e.g., when new videos load as the user scrolls).
 * It applies the content filtering logic to newly added elements to hide those associated with blocked authors.
 */
if (window.location.host === "www.youtube.com") {
  chrome.runtime.sendMessage({ action: "fetchBlockedAuthors" }, (response) => {
    const blockedAuthors = response.authors || [];

    const blockAuthors = () => {
      const authorLinks = document.querySelectorAll(
        "a.yt-simple-endpoint.yt-formatted-string"
      );
      const elementsWithBiggerThumb = document.querySelectorAll(
        '[bigger-thumb-style="DEFAULT"]'
      );

      authorLinks.forEach((link) => {
        const authorName = link.textContent.trim().toLowerCase();
        blockedAuthors.forEach((blockedAuthor) => {
          if (authorName === blockedAuthor.name.toLowerCase()) {
            const elementToHide = link.closest("#dismissible");
            if (elementToHide) {
              elementToHide.style.display = "none";
            }
          }
        });
      });

      elementsWithBiggerThumb.forEach((element) => {
        const authorDiv = element.querySelector("#text");
        blockedAuthors.forEach((blockedAuthor) => {
          if (
            authorDiv.textContent
              .toLowerCase()
              .includes(blockedAuthor.name.toLowerCase())
          ) {
            element.style.display = "none";
          }
        });
      });
    };

    blockAuthors();

    // Setting up a MutationObserver to observe DOM changes and apply the blocking logic to new elements.
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          blockAuthors();
        }
      });
    });

    // Configuration object for the observer: observing changes in child nodes and subtree.
    const config = { childList: true, subtree: true };

    // Start observing the document body for changes.
    observer.observe(document.body, config);
  });
}
