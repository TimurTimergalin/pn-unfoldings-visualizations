import pm4py
from pm4py.objects.petri_net.obj import PetriNet, Marking
from pm4py.objects.petri_net.utils import petri_utils
from unfoldings.unfolding_algorithms import standard_algorithm, n_safe_algorithm
from unfoldings.decorations import *
from unfoldings.cutoff_settings import MarkCutoffSettings
from unfoldings.order_settings import BasicOrderSettings
from nets_generators import generate_dining_philosophers

from visualize import visualize

net, m0 = generate_dining_philosophers(3)
decorations = ColorsDecorations(
    LabelsDecorations.standard(),
    starting_conditions="#aaffaa",
    cutoff_events="#ffaaaa"
)

events = []

pr = standard_algorithm(net, m0, BasicOrderSettings(), MarkCutoffSettings(), decorations, order_of_adding=events)

visualize(net, pr, events, decorations.get(), "df3")

net = PetriNet("6-safe")
p0 = petri_utils.add_place(net, "p0")
p1 = petri_utils.add_place(net, "p1")
t1 = petri_utils.add_transition(net, "t1")
petri_utils.add_arc_from_to(p0, t1, net)
petri_utils.add_arc_from_to(t1, p1, net)
m0 = Marking({p0: 6})

decorations = ColorsDecorations(
    LabelsDecorations.standard(),
    starting_conditions="#aaffaa",
    cutoff_events="#ffaaaa"
)

events = []

pr = standard_algorithm(net, m0, BasicOrderSettings(), MarkCutoffSettings(), decorations, order_of_adding=events)

visualize(net, pr, events, decorations.get(), "6_safe")

net = PetriNet("15-safe")
p0 = petri_utils.add_place(net, "p0")
p1 = petri_utils.add_place(net, "p1")
t1 = petri_utils.add_transition(net, "t1")
petri_utils.add_arc_from_to(p0, t1, net, 5)
petri_utils.add_arc_from_to(t1, p1, net)
m0 = Marking({p0: 15})

decorations = ColorsDecorations(
    LabelsDecorations.n_safe(),
    starting_conditions="#aaffaa",
    cutoff_events="#ffaaaa"
)

events = []

pr = n_safe_algorithm(net, m0, BasicOrderSettings(), MarkCutoffSettings(), decorations, order_of_adding=events)
visualize(net, pr, events, decorations.get(), "15_safe")
