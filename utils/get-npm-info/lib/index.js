const axios = require('axios')
const urlJoin = require('url-join')

function getNpmInfo (npmName, registry) {
  if (!npmName) {
    return
  }
  if (!registry) {
    registry = getDefaultRegistry()
  }

  const url = urlJoin(registry, npmName)

  return axios.get(`${url}`).then(res => {
    if (res.status === 200) {
      return res.data
    }
    return null
  }).catch(err => {
    return Promise.reject(err)
  })
}

async function getLastVersion (npmName, registry) {
  const data = await getNpmInfo(npmName, registry)
  const distTags = data['dist-tags']
  if (distTags) {
    return distTags.latest
  }
  return null
}

function getDefaultRegistry (isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

module.exports = {
  getNpmInfo,
  getLastVersion
};
