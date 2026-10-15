import argparse, sys, unittest
p = argparse.ArgumentParser(); p.add_argument("--start-directory", required=True)
a = p.parse_args()
r = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.discover(a.start_directory))
sys.exit(0 if r.wasSuccessful() else 1)
