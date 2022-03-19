export async function copyToClipboard(text) {
  try {
    return navigator.clipboard.writeText(text);
  } catch (error) {
    console.error(error);
  }
}

export function selectText(e) {
  if (window.getSelection && document.createRange) {
    const selection = window.getSelection();
    if (selection.toString() == "") {
      window.setTimeout(() => {
        const range = document.createRange();
        range.selectNodeContents(e.target);
        selection.removeAllRanges();
        selection.addRange(range);
      }, 1);
    }
  }

  // IE
  else if (document.selection) {
    const selection = document.selection.createRange();
    if (selection.text == "") {
      const range = document.body.createTextRange();
      range.moveToElementText(e.target);
      range.select();
    }
  }
}

export function sortUsers(users) {
  return users.sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date) - new Date(a.date);
    } else if (a.date) {
      return -1;
    } else if (b.date) {
      return 1;
    }

    return a.id.localeCompare(b.id);
  });
}
