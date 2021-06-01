# Functions:

- [`getPermitMessageHash(address _owner, address _spender, uint256 _amount, uint256 _nonce, uint256 _period)`](#VerifySignature-getPermitMessageHash-address-address-uint256-uint256-uint256-)

- [`getMessageHash(address _to, uint256 _amount, string _message, uint256 _nonce)`](#VerifySignature-getMessageHash-address-uint256-string-uint256-)

- [`getEthSignedMessageHash(bytes32 _messageHash)`](#VerifySignature-getEthSignedMessageHash-bytes32-)

- [`verify(address _signer, address _to, uint256 _amount, string _message, uint256 _nonce, bytes signature)`](#VerifySignature-verify-address-address-uint256-string-uint256-bytes-)

- [`recoverSigner(bytes32 _ethSignedMessageHash, bytes _signature)`](#VerifySignature-recoverSigner-bytes32-bytes-)

- [`recoverSigner2(bytes32 _ethSignedMessageHash, uint8 v, bytes32 r, bytes32 s)`](#VerifySignature-recoverSigner2-bytes32-uint8-bytes32-bytes32-)

- [`splitSignature(bytes sig)`](#VerifySignature-splitSignature-bytes-)

###### VerifySignature-getPermitMessageHash-address-address-uint256-uint256-uint256-

## Function `getPermitMessageHash(address _owner, address _spender, uint256 _amount, uint256 _nonce, uint256 _period)`

No description

###### VerifySignature-getMessageHash-address-uint256-string-uint256-

## Function `getMessageHash(address _to, uint256 _amount, string _message, uint256 _nonce)`

No description

###### VerifySignature-getEthSignedMessageHash-bytes32-

## Function `getEthSignedMessageHash(bytes32 _messageHash)`

No description

###### VerifySignature-verify-address-address-uint256-string-uint256-bytes-

## Function `verify(address _signer, address _to, uint256 _amount, string _message, uint256 _nonce, bytes signature)`

No description

###### VerifySignature-recoverSigner-bytes32-bytes-

## Function `recoverSigner(bytes32 _ethSignedMessageHash, bytes _signature)`

No description

###### VerifySignature-recoverSigner2-bytes32-uint8-bytes32-bytes32-

## Function `recoverSigner2(bytes32 _ethSignedMessageHash, uint8 v, bytes32 r, bytes32 s)`

No description

###### VerifySignature-splitSignature-bytes-

## Function `splitSignature(bytes sig)`

No description