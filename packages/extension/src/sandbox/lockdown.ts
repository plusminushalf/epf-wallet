import 'ses';

try {
  lockdown({
    consoleTaming: 'unsafe',
  });
} catch (error) {
  console.log('Error occurred while locking environment', error);
}
