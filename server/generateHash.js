const bcrypt = require('bcryptjs');

const password = 'Jad$$1455';

const generate = async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log('Hash:', hash);
};

generate();
