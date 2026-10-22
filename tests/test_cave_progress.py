import ast
import copy
from pathlib import Path
import unittest


def pickup_harness():
    # Execute the actual nested Pygame handler with its UI callbacks captured.
    source = ast.parse((Path(__file__).resolve().parents[1] / 'main.py').read_text(encoding='utf-8'))
    pickup = next(n for n in ast.walk(source) if isinstance(n, ast.FunctionDef) and n.name == 'pickup')
    tree = ast.parse('''
def factory():
    manual=False; trace=False; destiny=0; coins=10; note=''; quest=2; dialogues=[]
    def advance(n,text):
        nonlocal quest
        quest=max(quest,n)
    def say(rows):
        dialogues.append(rows)
    return pickup, lambda: (manual,trace,quest,destiny,coins,len(dialogues))
''')
    tree.body[0].body.insert(-1, copy.deepcopy(pickup))
    scope = {}
    exec(compile(ast.fix_missing_locations(tree), '<actual-pygame-pickup>', 'exec'), scope)
    return scope['factory']()


class CaveProgress(unittest.TestCase):
    def test_both_exploration_orders_and_no_duplicate_rewards(self):
        for order in [('manual','trace'), ('trace','manual')]:
            with self.subTest(order=order):
                pickup, snapshot = pickup_harness()
                pickup(order[0])
                self.assertLess(snapshot()[2], 4, 'One clue cannot unlock the ending')
                pickup(order[1])
                self.assertEqual(snapshot(), (True,True,4,25,20,1))
                pickup('manual'); pickup('trace')
                self.assertEqual(snapshot(), (True,True,4,25,20,1))
