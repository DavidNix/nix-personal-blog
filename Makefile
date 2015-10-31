.PHONY: deploy

default: deploy

deploy:
	hugo
	git add -A
	git commit -m "RELEASE `date`"
	git push origin develop
	git subtree push --prefix=public origin master	
