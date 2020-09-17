// node ./index.js filename.tsv
const repl = require("repl");
const { exec } = require("child_process");

const args = process.argv;
const TSV_HEADER = "Code\tText\tNamespace\tLanguageName\tLanguageId";

let selectedFileName = null;

async function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

const languages = [
  {
    key: "en",
    name: "English",
  },
  {
    key: "sv",
    name: "Swedish",
  },
  {
    key: "fi",
    name: "Finnish",
  },
  {
    key: "es",
    name: "Spanish",
  },
];

function addHeader() {
  exec(`echo "${TSV_HEADER}" >> ${selectedFileName}`);
}

function translationRow(translationKey, text) {
  var key = translationKey.split(".")[1];
  var namespace = translationKey.split(".")[0];

  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    var translation = `${key.toUpperCase()}\t${text}\t${namespace}\t${
      lang.name
    }\t${lang.key}`;
    exec(`echo "${translation}" >> ${selectedFileName}`);
  }
}

function customPrompt() {
  var fileNameMessage = "";

  if (selectedFileName) {
    fileNameMessage = "\033[0;32m" + selectedFileName + "\033[0m";
  } else {
    fileNameMessage =
      "\033[0;31mNo file selected\033[0m\n\n Use command:\n  .setFile filename\n";
  }

  console.clear();
  console.log(`Selected file: ${fileNameMessage}`);
  replServer.displayPrompt();
}

if (args.length > 2) {
  selectedFileName = args[2];
}

const replServer = repl.start({
  prompt: "> ",
});

customPrompt();

exec(`head -n 1 ${selectedFileName}`, (error, stdOut) => {
  if (selectedFileName != null && stdOut !== TSV_HEADER + "\n") {
    addHeader();
  }
});

async function askQuestion(query) {
  return new Promise((resolve) =>
    replServer.question(query, (ans) => {
      resolve(ans);
    })
  );
}

replServer.defineCommand("addHeader", {
  help: "",
  async action() {
    this.clearBufferedCommand();
    addHeader();
    this.displayPrompt();
  },
});

replServer.defineCommand("add", {
  help: "Appends row to selected file",
  async action(translationKey) {
    this.clearBufferedCommand();

    if (!selectedFileName) {
      console.log("\033[0;31mNo file selected\033[0m");
      this.displayPrompt();
      return;
    }
    if (!translationKey) {
      translationKey = await askQuestion("Enter translation key: ");
    }

    var translationText = await askQuestion("Enter translation text: ");

    translationRow(translationKey, translationText);

    this.displayPrompt();
  },
});

replServer.defineCommand("list", {
  help: "",
  async action() {
    this.clearBufferedCommand();
    exec(`ls -1 *tsv | sed -e 's/\.tsv$//'`, (error, stdOut) => {
      console.log(stdOut);
      this.displayPrompt();
    });
  },
});

replServer.defineCommand("setFile", {
  help: "Set the current file for edit",
  action(filename) {
    this.clearBufferedCommand();
    selectedFileName = filename;
    customPrompt();
  },
});
