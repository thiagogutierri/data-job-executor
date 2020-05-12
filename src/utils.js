/**
 * Módulo que serve funções utilitárias para necessidades diversas.
 */

module.exports = {
  // primeira letra do texto em maiúsculo
  capitalizeFirst: text => text.charAt(0).toUpperCase().concat(text.slice(1)),

  // require de um módulo sem cache
  requireUncached: module => {
    delete require.cache[require.resolve(module)]
    return require(module)
  }
}
