class SVGNavigator {
            constructor(containerId) {
                this.container = d3.select(`.${containerId}`);
                this.width = window.innerWidth;
                this.height = window.innerHeight;
                this.currentTransform = d3.zoomIdentity;
                this.gridVisible = false;

                // Récupérer le SVG existant dans le DOM
                this.existingSVG = this.container.select('svg');
                
                this.initSVG();
                this.setupZoom();
                this.setupEventListeners();
                this.initializeExistingSVG();
            }

            initSVG() {
              this.svg = this.existingSVG
                .attr('width', this.width)
                .attr('height', this.height)
                .style('position', 'absolute')
                .style('top', 0)
                .style('left', 0);
                
                // Créer le groupe principal pour le zoom
                this.zoomGroup = this.svg
                    .insert('g', ':first-child')
                    .attr('class', 'zoom-group');

                // Créer un groupe pour la grille
                this.gridGroup = this.zoomGroup
                    .append('g')
                    .attr('class', 'grid-group');

                // Créer un groupe pour le contenu
                this.contentGroup = this.zoomGroup
                    .append('g')
                    .attr('class', 'content-group');
            }

            setupZoom() {
                // Configuration du comportement de zoom
                this.zoom = d3.zoom()
                    .scaleExtent([0.1, 20]) // Zoom de 10% à 2000%
                    .on('zoom', (event) => {
                        this.currentTransform = event.transform;
                        this.zoomGroup.attr('transform', event.transform);
                    })
                    .on('start', () => {
                        this.container.classed('grabbing', true);
                    })
                    .on('end', () => {
                        this.container.classed('grabbing', false);
                    });

                // Appliquer le zoom au SVG
                this.svg.call(this.zoom);

                // Double-clic pour zoom rapide
                this.svg.on('dblclick.zoom', (event) => {
                    event.preventDefault();
                    const [x, y] = d3.pointer(event);
                    this.zoomTo(x, y, this.currentTransform.k * 2);
                });
            }

            setupEventListeners() {
                // Redimensionnement de la fenêtre
                window.addEventListener('resize', () => this.handleResize());

                // Raccourcis clavier
                document.addEventListener('keydown', (event) => {
                    if (event.ctrlKey || event.metaKey) {
                        switch(event.key) {
                            case '=':
                            case '+':
                                event.preventDefault();
                                this.zoomIn();
                                break;
                            case '-':
                                event.preventDefault();
                                this.zoomOut();
                                break;
                            case '0':
                                event.preventDefault();
                                this.resetView();
                                break;
                        }
                    }
                });
            }

            initializeExistingSVG() {
                try {
                    if (this.existingSVG && !this.existingSVG.empty()) {
                        // Récupérer tout le contenu du SVG existant
                        const allContent = this.existingSVG.html();
                        
                        if (allContent && allContent.trim() !== '') {
                            // Vider d'abord le SVG
                            this.existingSVG.selectAll('*').remove();
                            
                            // Recréer la structure avec les groupes
                            this.zoomGroup = this.svg
                                .append('g')
                                .attr('class', 'zoom-group');

                            this.gridGroup = this.zoomGroup
                                .append('g')
                                .attr('class', 'grid-group');

                            this.contentGroup = this.zoomGroup
                                .append('g')
                                .attr('class', 'content-group');
                            
                            // Ajouter le contenu original
                            this.contentGroup.html(allContent);
                            
                            // Récupérer les dimensions du viewBox si disponible
                            const viewBox = this.existingSVG.attr('viewBox');
                            if (viewBox) {
                                const [x, y, width, height] = viewBox.split(' ').map(Number);
                                this.originalViewBox = { x, y, width, height };
                            }
                        } else {
                            console.warn('Le SVG existe mais n\'a pas de contenu');
                        }
                        
                    } else {
                        console.warn('Aucun SVG existant trouvé');
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'initialisation du SVG existant:', error);
                }
            }

            zoomIn() {
                const newScale = Math.min(this.currentTransform.k * 1.5, 20);
                this.zoomToScale(newScale);
            }

            zoomOut() {
                const newScale = Math.max(this.currentTransform.k / 1.5, 0.1);
                this.zoomToScale(newScale);
            }

            zoomToScale(scale) {
                const centerX = this.width / 2;
                const centerY = this.height / 2;
                this.zoomTo(centerX, centerY, scale);
            }

            zoomTo(x, y, scale) {
                const duration = 300;
                
                this.svg
                    .transition()
                    .duration(duration)
                    .call(
                        this.zoom.transform,
                        d3.zoomIdentity
                            .translate(x, y)
                            .scale(scale)
                            .translate(-x / scale, -y / scale)
                    );
            }

            resetView() {
                this.svg
                    .transition()
                    .duration(500)
                    .call(this.zoom.transform, d3.zoomIdentity);
            }

            handleResize() {
                this.width = window.innerWidth;
                this.height = window.innerHeight;
                
                this.svg
                    .attr('width', this.width)
                    .attr('height', this.height);
            }
        }

        // Initialiser l'application
        document.addEventListener('DOMContentLoaded', () => {
            const navigator = new SVGNavigator('svg-container');
        });