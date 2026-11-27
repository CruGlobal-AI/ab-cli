//
// updateDev
// Update code in the developer folder
//
// options:
//  --refresh : after the pull, rebuild stale .gz files in developer/web
//
const async = require("async");
const shell = require("shelljs");
const path = require("path");
const utils = require(path.join(__dirname, "..", "utils", "utils"));
const fs = require("fs");
const chalk = require("chalk");
const zlib = require("zlib");

var Options = {}; // the running options for this command.

const pathToDevFolder = path.resolve(process.cwd(), "developer");
const localRepos = [];
//
// Build the Install Command
//
var Command = new utils.Resource({
   command: "devUpdate",
   params: "",
   descriptionShort: "Update code in the developer folder",
   descriptionLong: `
`,
});

module.exports = Command;

Command.help = function () {
   console.log(`

  usage: $ appbuilder update dev [--refresh]

  --refresh : after the pull, rebuild any .gz in developer/web that is older
              than the file next to it, and delete .gz files with no source.
              nginx serves the .gz first (gzip_static), so a stale one hides
              a local frontend build.

`);
};

Command.run = function (options) {
   return new Promise((resolve, reject) => {
      async.series(
         [
            // copy our passed in options to our Options
            (done) => {
               for (var o in options) {
                  Options[o] = options[o];
               }

               done();
            },
            checkFolder,
            checkLocalRepos,
            gitPull,
            refreshGzip,
         ],
         (err) => {
            if (err) {
               reject(err);
               return;
            }
            resolve();
         }
      );
   });
};

/**
 * Verify that the developer path exists
 * @function checkFolder
 * @param {function} done  node style callback(err)
 */
function checkFolder(done) {
   console.log(`Check the developer folder exists`);
   try {
      if (fs.statSync(pathToDevFolder).isDirectory()) {
         console.log("   ... done\n");
         done();
      }
   } catch (e) {
      console.log(chalk.red(`Could not find the path ${pathToDevFolder}`));
      process.exit(1);
   }
}

/**
 * Find the repos in the developer folder including plugins
 * @function checkLocalRepos
 * @param {function} done  node style callback(err)
 */
function checkLocalRepos(done) {
   const contents = fs.readdirSync(pathToDevFolder, { withFileTypes: true });
   const pluginsPath = path.join(pathToDevFolder, "plugins");
   contents.forEach((item) => {
      if (!item.isDirectory()) return;
      if (item.name !== "plugins") {
         localRepos.push({
            name: item.name,
            path: path.join(pathToDevFolder, item.name),
         });
      } else {
         const plugins = fs.readdirSync(pluginsPath, { withFileTypes: true });
         plugins.forEach((plugin) => {
            if (!item.isDirectory()) return;
            localRepos.push({
               name: plugin.name,
               path: path.join(pluginsPath, plugin.name),
            });
         });
      }
   });
   done();
}

/**
 * Runs git pull in each repo
 * @function gitPull
 * @param {function} done  node style callback(err)
 */
function gitPull(done) {
   const total = localRepos.length;
   let pullNum = 1;
   async.eachSeries(
      localRepos,
      (repo, cb) => {
         console.log(
            `\ngit pull ${repo.name} ` + chalk.cyan(`${pullNum}/${total}`)
         );
         pullNum++;
         shell.cd(repo.path);
         shell.exec("git pull --recurse-submodules");
         cb();
      },
      done
   );
}

/**
 * Rebuild stale .gz files in developer/web/assets.
 * nginx serves <file>.gz when it exists, so after a local frontend build the
 * browser keeps getting the old bundle until the .gz is rebuilt.
 * Only runs with --refresh.
 * @function refreshGzip
 * @param {function} done  node style callback(err)
 */
function refreshGzip(done) {
   if (!Options.refresh) return done();

   const assetsPath = path.join(pathToDevFolder, "web", "assets");
   console.log(`\nRefresh stale .gz files in ${assetsPath}`);
   if (!fs.existsSync(assetsPath)) {
      console.log(chalk.yellow("   ... no developer/web/assets, skipping\n"));
      return done();
   }

   let rebuilt = 0;
   let removed = 0;
   try {
      findGzFiles(assetsPath).forEach((gz) => {
         const src = gz.slice(0, -3);
         const rel = path.relative(assetsPath, gz);
         if (!fs.existsSync(src)) {
            fs.unlinkSync(gz);
            removed++;
            console.log(`   removed ${rel} (no source)`);
            return;
         }
         // whole seconds: `gzip -k` copies the source mtime without the
         // sub-second part, so a fresh .gz can look a few ms older.
         const secs = (f) => Math.floor(fs.statSync(f).mtimeMs / 1000);
         if (secs(src) > secs(gz)) {
            const data = zlib.gzipSync(fs.readFileSync(src), { level: 9 });
            fs.writeFileSync(gz, data);
            rebuilt++;
            console.log(`   rebuilt ${rel}`);
         }
      });
   } catch (e) {
      return done(e);
   }
   console.log(`   ... done (${rebuilt} rebuilt, ${removed} removed)\n`);
   done();
}

/**
 * List all .gz files under a folder.
 * @function findGzFiles
 * @param {string} dir
 * @return {string[]} absolute paths
 */
function findGzFiles(dir) {
   let found = [];
   fs.readdirSync(dir, { withFileTypes: true }).forEach((item) => {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
         found = found.concat(findGzFiles(full));
      } else if (item.name.endsWith(".gz")) {
         found.push(full);
      }
   });
   return found;
}
