const fs = require("fs");
const find = require("lodash.find");

function getSrcIndices(node) {
  return node.src
    .split(":")
    .map(val => parseInt(val))
    .slice(0, 2);
}

function extractNodeSource(source, node) {
  const [sourceStart, sourceLen] = getSrcIndices(node);
  return source.slice(sourceStart, sourceStart + sourceLen);
}

function findNode(contractName, nodes, predicate) {
  const contractNode = find(nodes, ["name", contractName]);
  const node = find(contractNode.nodes, predicate);
  return node;
}

function constructorToInitializer(sourceCode, constructorNode) {
  const constructorSource = extractNodeSource(sourceCode, constructorNode);
  const initializerSource = constructorSource.replace(
    /\bconstructor/,
    "function initialize"
  );
  return sourceCode.replace(constructorSource, initializerSource);
}

function renameContract(sourceCode, contractName, nodes, appendToName) {
  const contractNode = find(nodes, ["name", contractName]);
  const contractSource = extractNodeSource(sourceCode, contractNode);
  const renamedContractSource = contractSource.replace(
    contractName,
    `${contractName}${appendToName}`
  );
  return sourceCode.replace(contractSource, renamedContractSource);
}

function transpileConstructor(contractName) {
  const contractData = JSON.parse(
    fs.readFileSync(`./build/contracts/${contractName}.json`)
  );
  const constructorNode = findNode(contractName, contractData.ast.nodes, [
    "kind",
    "constructor"
  ]);
  const contractWithInitializer = renameContract(
    constructorToInitializer(contractData.source, constructorNode),
    contractName,
    contractData.ast.nodes,
    "Upgradable"
  );

  fs.writeFileSync(
    `./contracts/${contractName}Upgraded.sol`,
    contractWithInitializer
  );
}

transpileConstructor("GLDToken");
transpileConstructor("Simple");