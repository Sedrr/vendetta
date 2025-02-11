import { findByProps, findByDisplayName } from "@vendetta/metro";

const MessageActions = findByProps("sendMessage", "receiveMessage");
const Locale = findByProps("Messages");

const endings = [
  "rawr x3",
  "OwO",
  "UwU",
  "o.O",
  "-.-",
  ">w<",
  "(⑅˘꒳˘)",
  "(ꈍᴗꈍ)",
  "(˘ω˘)",
  "(U ᵕ U❁)",
  "σωσ",
  "òωó",
  "(///ˬ///✿)",
  "(U ﹏ U)",
  "( ͡o ω ͡o )",
  "ʘwʘ",
  ":3",
  ":3", // important enough to have twice
  ":3", // important enough to have thrice
  "XD",
  "nyaa~~",
  "mya",
  ">_<",
  "😳",
  "🥺",
  "😳😳😳",
  "rawr",
  "^^",
  "^^;;",
  "(ˆ ﻌ ˆ)♡",
  "^•ﻌ•^",
  "/(^•ω•^)",
  "(✿oωo)",
];

const replacements = [
  ["small", "smol"],
  ["cute", "kawaii"],
  ["fluff", "floof"],
  ["love", "luv"],
  ["stupid", "baka"],
  ["what", "nani"],
  ["meow", "nya"],
  ["hello", "hewwo"],
];

function selectRandomElement(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

const isOneCharacterString = (str: string): boolean => {
  return str.split("").every((char: string) => char === str[0]);
};

function replaceString(inputString) {
  let replaced = false;
  for (const replacement of replacements) {
    const regex = new RegExp(`\\b${replacement[0]}\\b`, "gi");
    if (regex.test(inputString)) {
      inputString = inputString.replace(regex, replacement[1]);
      replaced = true;
    }
  }
  return replaced ? inputString : false;
}

function uwuify(message: string): string {
  const rule = /\S+|\s+/g;
  const words: string[] | null = message.match(rule);
  let answer = "";

  if (words === null) return "";

  for (let i = 0; i < words.length; i++) {
    if (isOneCharacterString(words[i]) || words[i].startsWith("https://")) {
      answer += words[i];
      continue;
    }

    if (!replaceString(words[i])) {
      answer += words[i]
        .replace(/n(?=[aeo])/g, "ny")
        .replace(/l|r/g, "w");
    } else answer += replaceString(words[i]);
  }

  answer += " " + selectRandomElement(endings);
  return answer;
}

function uwuifyArray(arr) {
  const newArr = [...arr];

  newArr.forEach((item, index) => {
    if (Array.isArray(item)) {
      newArr[index] = uwuifyArray(item);
    } else if (typeof item === "string") {
      newArr[index] = uwuify(item);
    }
  });

  return newArr;
}

function onSendMessage(content) {
  const modifiedContent = uwuify(content);
  MessageActions.sendMessage(ctx.channel.id, {
    content: modifiedContent,
  });
}

let patches = [];

export default {
  onLoad: () => {
    patches.push(
      findByDisplayName("MessageContent")
        .default.displayName("MessageContent")
        .prototype.sendMessagePatched = function (e, t) {
          onSendMessage(t.content);
          return this.sendMessageOriginal(e, t);
        }
    );
  },
  onUnload: () => {
    for (const unpatch of patches) unpatch();
  },
};
