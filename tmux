#!/bin/bash
set -e

session=nixblog

if ! tmux ls | grep -q "$session"; then
	tmux new-session -d -s $session

	tmux rename-window $session
	tmux split-window -v

	tmux send-keys -t $session:1.1 "vim" C-m

	tmux resize-pane -t $session:1.2 -D 20

	tmux split-window -h
	tmux send-keys -t $session:1.3 "hugo server -w" C-m
fi

tmux select-pane -U
exec tmux attach-session -d -t $session
