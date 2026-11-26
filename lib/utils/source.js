/**
 * source
 * Where AppBuilder code and images come from.
 *
 * Defaults point at the CruGlobal-AI fork of the stack. Override with:
 *    AB_GITHUB_ORG      GitHub org to clone repos from (eg CruGlobal)
 *    AB_IMAGE_REGISTRY  Image prefix for service images (eg docker.io/digiserve)
 */
const GITHUB_ORG = process.env.AB_GITHUB_ORG || "CruGlobal-AI";
const IMAGE_REGISTRY = (
   process.env.AB_IMAGE_REGISTRY || "ghcr.io/cruglobal-ai"
).replace(/\/+$/, "");

module.exports = {
   GITHUB_ORG,
   IMAGE_REGISTRY,

   /**
    * @param {string} repo repository name, eg "ab_runtime"
    * @param {string} [auth] optional "token@" prefix for private clones
    * @return {string} https clone url
    */
   gitURL(repo, auth = "") {
      return `https://${auth}github.com/${GITHUB_ORG}/${repo}.git`;
   },

   /**
    * @param {string} name image name, eg "ab-migration-manager"
    * @param {string} tag
    * @return {string} full image reference
    */
   image(name, tag) {
      return `${IMAGE_REGISTRY}/${name}:${tag}`;
   },
};
